const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('./db');
const { getIntegrationConfig, getPublicIntegrationConfig, saveIntegrationConfig } = require('./integrationConfig');

test('persists integration settings encrypted and omits secrets from public settings', () => {
  const previousSettings = getPublicIntegrationConfig();
  const rollbackTestSettings = db.transaction(() => {
    const publicSettings = saveIntegrationConfig({
      mailHost: 'smtp.test.invalid',
      mailPort: 2525,
      mailSecure: true,
      mailUser: 'admin@example.invalid',
      mailPassword: 'smtp-test-password',
      razorpayKeyId: 'rzp_test_key',
      razorpayKeySecret: 'razorpay-test-secret',
      razorpayWebhookSecret: 'webhook-test-secret'
    });
    const resolved = getIntegrationConfig();
    const encryptedValue = db.prepare('SELECT value FROM app_settings WHERE key=?').get('integrations').value;

    assert.equal(resolved.mailHost, 'smtp.test.invalid');
    assert.equal(resolved.mailPassword, 'smtp-test-password');
    assert.equal(resolved.razorpayKeySecret, 'razorpay-test-secret');
    assert.equal(publicSettings.mailPasswordConfigured, true);
    assert.equal(publicSettings.razorpayWebhookSecretConfigured, true);
    assert.equal(Object.hasOwn(publicSettings, 'mailPassword'), false);
    assert.equal(Object.hasOwn(publicSettings, 'razorpayKeySecret'), false);
    assert.equal(encryptedValue.includes('smtp-test-password'), false);
    assert.equal(encryptedValue.includes('razorpay-test-secret'), false);

    saveIntegrationConfig({ mailPassword: '' });
    assert.equal(getIntegrationConfig().mailPassword, 'smtp-test-password');
    throw new Error('rollback temporary integration settings');
  });

  assert.throws(() => rollbackTestSettings(), /rollback temporary integration settings/);
  const restoredSettings = getPublicIntegrationConfig();
  assert.equal(restoredSettings.mailPasswordConfigured, previousSettings.mailPasswordConfigured);
  assert.equal(restoredSettings.razorpayKeySecretConfigured, previousSettings.razorpayKeySecretConfigured);
});