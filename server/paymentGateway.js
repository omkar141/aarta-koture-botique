const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getIntegrationConfig } = require('./integrationConfig');

let razorpayClient;
let razorpayClientKey;

const isGatewayConfigured = () => {
  const config = getIntegrationConfig();
  return Boolean(config.razorpayKeyId && config.razorpayKeySecret && config.razorpayWebhookSecret);
};

const getRazorpayClient = () => {
  if (!isGatewayConfigured()) throw new Error('Razorpay is not configured on the server');
  const config = getIntegrationConfig();
  const configKey = `${config.razorpayKeyId}:${config.razorpayKeySecret}`;
  if (!razorpayClient || razorpayClientKey !== configKey) {
    razorpayClient = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    });
    razorpayClientKey = configKey;
  }
  return razorpayClient;
};

const timingSafeMatch = (expected, received) => {
  if (typeof expected !== 'string' || typeof received !== 'string' || !/^[a-f\d]{64}$/i.test(expected) || !/^[a-f\d]{64}$/i.test(received)) return false;
  const expectedBytes = Buffer.from(expected, 'hex');
  const receivedBytes = Buffer.from(received, 'hex');
  return expectedBytes.length === receivedBytes.length
    && expectedBytes.length > 0
    && crypto.timingSafeEqual(expectedBytes, receivedBytes);
};

const verifyCheckoutSignature = (orderId, paymentId, signature, secret) => {
  secret = secret || getIntegrationConfig().razorpayKeySecret;
  if (!orderId || !paymentId || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return timingSafeMatch(expected, signature);
};

const verifyWebhookSignature = (rawBody, signature, secret) => {
  secret = secret || getIntegrationConfig().razorpayWebhookSecret;
  if (!rawBody || !secret) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return timingSafeMatch(expected, signature);
};

const amountToPaise = amount => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error('Amount must be greater than zero');
  const paise = Math.round(numericAmount * 100);
  if (Math.abs(numericAmount * 100 - paise) > 1e-7) throw new Error('Amount cannot have more than two decimal places');
  return paise;
};

const isSettledStatus = status => ['paid', 'completed', 'captured'].includes(String(status || '').toLowerCase());

module.exports = {
  amountToPaise,
  getRazorpayClient,
  isGatewayConfigured,
  isSettledStatus,
  verifyCheckoutSignature,
  verifyWebhookSignature
};