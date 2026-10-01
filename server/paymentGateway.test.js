const crypto = require('crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('./db');
const {
  amountToPaise,
  isSettledStatus,
  isGatewayConfigured,
  verifyCheckoutSignature,
  verifyWebhookSignature
} = require('./paymentGateway');

test('converts INR amounts to paise and rejects invalid precision', () => {
  assert.equal(amountToPaise('125.50'), 12550);
  assert.throws(() => amountToPaise(0), /greater than zero/);
  assert.throws(() => amountToPaise(1.001), /two decimal places/);
});

test('verifies Razorpay checkout signatures and rejects altered values', () => {
  const orderId = 'order_test123';
  const paymentId = 'pay_test123';
  const secret = 'test-secret';
  const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  assert.equal(verifyCheckoutSignature(orderId, paymentId, signature, secret), true);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, `${signature}00`, secret), false);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, `${signature}zz`, secret), false);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, signature, ''), false);
});

test('verifies webhook signatures against the exact raw payload', () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const secret = 'webhook-test-secret';
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.failed"}'), signature, secret), false);
});

test('recognizes captured legacy and gateway payment states', () => {
  assert.equal(isSettledStatus('Paid'), true);
  assert.equal(isSettledStatus('Completed'), true);
  assert.equal(isSettledStatus('captured'), true);
  assert.equal(isSettledStatus('Pending'), false);
  assert.equal(isSettledStatus('Failed'), false);
});

test('requires checkout keys and a webhook secret before enabling payments', () => {
  const names = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const original = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const verifyEnvironmentFallback = db.transaction(() => {
    db.prepare('DELETE FROM app_settings WHERE key=?').run('integrations');
    process.env.RAZORPAY_KEY_ID = 'key';
    process.env.RAZORPAY_KEY_SECRET = 'secret';
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    assert.equal(isGatewayConfigured(), false);
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-secret';
    assert.equal(isGatewayConfigured(), true);
    throw new Error('rollback integration settings');
  });
  try {
    assert.throws(() => verifyEnvironmentFallback(), /rollback integration settings/);
  } finally {
    for (const name of names) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
});