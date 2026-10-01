const nodemailer = require('nodemailer');
const { db } = require('./db');
const { createEmailTemplate } = require('./emailTemplates');
const { getIntegrationConfig } = require('./integrationConfig');
let cachedTransporter;
let cachedTransporterKey;

const getTransporter = config => {
  if (!config.mailHost || !config.mailUser || !config.mailPassword) return null;
  const transporterKey = JSON.stringify([config.mailHost, config.mailPort, config.mailSecure, config.mailUser, config.mailPassword]);
  if (transporterKey !== cachedTransporterKey) {
    cachedTransporter = nodemailer.createTransport({
      host: config.mailHost,
      port: Number(config.mailPort || 587),
      secure: config.mailSecure,
      auth: { user: config.mailUser, pass: config.mailPassword }
    });
    cachedTransporterKey = transporterKey;
  }
  return cachedTransporter;
};

const notificationEmails = config => (config.mailNotifyEmails || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

const recipientsFor = (table, record, config) => {
  if (table === 'customers' || table === 'users') return record.email ? [record.email] : [];
  if (table === 'orders') return db.prepare('SELECT email FROM customers WHERE id=? AND tenantId=?').get(record.customerId, record.tenantId)?.email ? [db.prepare('SELECT email FROM customers WHERE id=? AND tenantId=?').get(record.customerId, record.tenantId).email] : notificationEmails(config);
  if (table === 'payments') {
    const customer = record.customerId
      ? db.prepare('SELECT email FROM customers WHERE id=? AND tenantId=?').get(record.customerId, record.tenantId)
      : null;
    const orderCustomer = record.orderId
      ? db.prepare('SELECT c.email FROM customers c JOIN orders o ON o.customerId=c.id AND o.tenantId=c.tenantId WHERE o.id=? AND o.tenantId=?').get(record.orderId, record.tenantId)
      : null;
    return [customer?.email || orderCustomer?.email].filter(Boolean).length
      ? [customer?.email || orderCustomer?.email]
      : notificationEmails(config);
  }
  return notificationEmails(config);
};

const sendEntityEventEmail = async (event, table, record) => {
  const config = getIntegrationConfig();
  const transporter = getTransporter(config);
  const recipients = recipientsFor(table, record, config);
  if (!recipients.length) return { status: 'skipped', reason: 'No recipient email address' };
  if (!transporter) {
    console.warn(`Email skipped for ${event}: configure MAIL_HOST, MAIL_USER, and MAIL_PASSWORD.`);
    return { status: 'skipped', reason: 'Mail service is not configured' };
  }

  const message = createEmailTemplate(event, record);
  try {
    const result = await transporter.sendMail({
      from: config.mailFrom || config.mailUser,
      to: recipients.join(', '),
      subject: message.subject,
      text: message.text,
      html: message.html
    });
    console.log(`${event} email sent to ${recipients.join(', ')}: ${result.messageId}`);
    return { status: 'sent', messageId: result.messageId };
  } catch (error) {
    console.error(`${event} email failed for ${recipients.join(', ')}:`, error.message);
    return { status: 'failed', reason: error.message };
  }
};

module.exports = { sendEntityEventEmail };
