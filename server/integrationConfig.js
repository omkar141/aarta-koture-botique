const crypto = require('crypto');
const { db } = require('./db');

const configKey = 'integrations';
const encryptionKey = crypto.createHash('sha256')
  .update(process.env.CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET || 'change-this-secret-in-production')
  .digest();

const encrypt = value => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
};

const decrypt = value => {
  const [iv, authTag, encrypted] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8'));
};

const readStoredConfig = () => {
  const row = db.prepare('SELECT value FROM app_settings WHERE key=?').get(configKey);
  return row ? decrypt(row.value) : {};
};

const getIntegrationConfig = () => {
  const stored = readStoredConfig();
  return {
    mailHost: process.env.MAIL_HOST || '',
    mailPort: Number(process.env.MAIL_PORT || 587),
    mailSecure: process.env.MAIL_SECURE === 'true',
    mailUser: process.env.MAIL_USER || '',
    mailPassword: process.env.MAIL_PASSWORD || '',
    mailFrom: process.env.MAIL_FROM || '',
    mailNotifyEmails: process.env.MAIL_NOTIFY_EMAILS || '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    ...stored
  };
};

const getPublicIntegrationConfig = () => {
  const config = getIntegrationConfig();
  return {
    mailHost: config.mailHost,
    mailPort: config.mailPort,
    mailSecure: config.mailSecure,
    mailUser: config.mailUser,
    mailFrom: config.mailFrom,
    mailNotifyEmails: config.mailNotifyEmails,
    mailPasswordConfigured: Boolean(config.mailPassword),
    razorpayKeyId: config.razorpayKeyId,
    razorpayKeySecretConfigured: Boolean(config.razorpayKeySecret),
    razorpayWebhookSecretConfigured: Boolean(config.razorpayWebhookSecret)
  };
};

const saveIntegrationConfig = input => {
  const stored = readStoredConfig();
  const fields = [
    'mailHost', 'mailPort', 'mailSecure', 'mailUser', 'mailFrom', 'mailNotifyEmails',
    'mailPassword', 'razorpayKeyId', 'razorpayKeySecret', 'razorpayWebhookSecret'
  ];
  for (const field of fields) {
    if (input[field] !== undefined && input[field] !== '') stored[field] = input[field];
  }
  db.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(configKey, encrypt(stored));
  return getPublicIntegrationConfig();
};

module.exports = { getIntegrationConfig, getPublicIntegrationConfig, saveIntegrationConfig };