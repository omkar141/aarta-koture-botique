const nodemailer = require('nodemailer');
const { db } = require('./db');
const { createEmailTemplate } = require('./emailTemplates');

const hasMailConfig = Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD);
const transporter = hasMailConfig
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    })
  : null;

const notificationEmails = () => (process.env.MAIL_NOTIFY_EMAILS || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

const recipientsFor = (table, record) => {
  if (table === 'customers' || table === 'users') return record.email ? [record.email] : [];
  if (table === 'orders') return db.prepare('SELECT email FROM customers WHERE id=?').get(record.customerId)?.email ? [db.prepare('SELECT email FROM customers WHERE id=?').get(record.customerId).email] : notificationEmails();
  if (table === 'payments') {
    const customer = record.customerId
      ? db.prepare('SELECT email FROM customers WHERE id=?').get(record.customerId)
      : null;
    const orderCustomer = record.orderId
      ? db.prepare('SELECT c.email FROM customers c JOIN orders o ON o.customerId=c.id WHERE o.id=?').get(record.orderId)
      : null;
    return [customer?.email || orderCustomer?.email].filter(Boolean).length
      ? [customer?.email || orderCustomer?.email]
      : notificationEmails();
  }
  return notificationEmails();
};

const sendEntityEventEmail = async (event, table, record) => {
  const recipients = recipientsFor(table, record);
  if (!recipients.length) return { status: 'skipped', reason: 'No recipient email address' };
  if (!transporter) {
    console.warn(`Email skipped for ${event}: configure MAIL_HOST, MAIL_USER, and MAIL_PASSWORD.`);
    return { status: 'skipped', reason: 'Mail service is not configured' };
  }

  const message = createEmailTemplate(event, record);
  try {
    const result = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
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
