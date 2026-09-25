const { createCustomerWelcomeEmail } = require('./customerWelcome');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const labels = {
  'customer.updated': 'Your customer profile was updated',
  'customer.measurementsUpdated': 'Your measurements were updated',
  'order.created': 'Your order has been created',
  'order.updated': 'Your order has been updated',
  'order.statusChanged': 'Your order status has changed',
  'order.assigned': 'Your order assignment was updated',
  'payment.created': 'Your payment was recorded',
  'payment.updated': 'Your payment was updated',
  'inventory.created': 'New inventory was added',
  'inventory.updated': 'Inventory was updated',
  'inventory.quantityUpdated': 'Inventory quantity was updated',
  'user.created': 'Your boutique account was created',
  'user.updated': 'Your boutique account was updated',
  'user.statusChanged': 'Your boutique account status changed',
  'role.created': 'A new boutique role was created',
  'role.updated': 'A boutique role was updated'
};

const detailLines = (event, record) => {
  const details = [];
  if (record.customerId) details.push(['Customer ID', record.customerId]);
  if (record.orderId) details.push(['Order ID', record.orderId]);
  if (record.name) details.push(['Name', record.name]);
  if (record.customerName) details.push(['Customer', record.customerName]);
  if (record.status) details.push(['Status', record.status]);
  if (record.amount !== undefined) details.push(['Amount', `INR ${record.amount}`]);
  if (record.paymentMode || record.paymentMethod) details.push(['Payment mode', record.paymentMode || record.paymentMethod]);
  if (record.assignedTo) details.push(['Assigned to', record.assignedTo]);
  if (record.dressType) details.push(['Dress type', record.dressType]);
  if (record.itemName || record.name && event.startsWith('inventory.')) details.push(['Item', record.itemName || record.name]);
  if (record.quantity !== undefined) details.push(['Quantity', record.quantity]);
  if (record.displayName) details.push(['Role', record.displayName]);
  if (record.email) details.push(['Email', record.email]);
  return details;
};

const createGenericTemplate = (event, record) => {
  const title = labels[event] || 'Your boutique record was updated';
  const safeTitle = escapeHtml(title);
  const details = detailLines(event, record)
    .map(([label, value]) => `<tr><td style="padding:8px 0;color:#765e64;">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;font-weight:600;">${escapeHtml(value)}</td></tr>`)
    .join('');
  const textDetails = detailLines(event, record).map(([label, value]) => `${label}: ${value}`).join('\n');

  return {
    subject: `${title} | Om Srinivas Boutique`,
    text: `Hello ${record.name || record.customerName || 'there'},\n\n${title}.\n\n${textDetails}\n\nOm Srinivas Boutique`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fff7f8;color:#3d3034;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f8;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #efd8dc;">
          <tr><td style="background:#9d3f58;padding:30px 36px;text-align:center;color:#ffffff;">
            <div style="color:#f5d78e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Om Srinivas Boutique</div>
            <h1 style="margin:12px 0 0;font-size:25px;font-weight:600;">${safeTitle}</h1>
          </td></tr>
          <tr><td style="padding:36px;">
            <p style="font-size:16px;line-height:1.7;">Hello ${escapeHtml(record.name || record.customerName || 'there')},</p>
            <p style="font-size:16px;line-height:1.7;">This is a confirmation of a recent change in your boutique records.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#fffaf0;border-left:4px solid #d4a84f;padding:8px 20px;">${details}</table>
            <p style="font-size:16px;line-height:1.7;">Warmly,<br><strong style="color:#9d3f58;">The Om Srinivas Boutique Team</strong></p>
          </td></tr>
          <tr><td style="background:#3d3034;padding:20px 36px;color:#f8e9eb;text-align:center;font-size:12px;line-height:1.6;">Bespoke tailoring and couture<br>Please do not reply to this automated message.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  };
};

const templates = {
  'customer.created': createCustomerWelcomeEmail,
  'customer.updated': record => createGenericTemplate('customer.updated', record),
  'customer.measurementsUpdated': record => createGenericTemplate('customer.measurementsUpdated', record),
  'order.created': record => createGenericTemplate('order.created', record),
  'order.updated': record => createGenericTemplate('order.updated', record),
  'order.statusChanged': record => createGenericTemplate('order.statusChanged', record),
  'order.assigned': record => createGenericTemplate('order.assigned', record),
  'payment.created': record => createGenericTemplate('payment.created', record),
  'payment.updated': record => createGenericTemplate('payment.updated', record),
  'inventory.created': record => createGenericTemplate('inventory.created', record),
  'inventory.updated': record => createGenericTemplate('inventory.updated', record),
  'inventory.quantityUpdated': record => createGenericTemplate('inventory.quantityUpdated', record),
  'user.created': record => createGenericTemplate('user.created', record),
  'user.updated': record => createGenericTemplate('user.updated', record),
  'user.statusChanged': record => createGenericTemplate('user.statusChanged', record),
  'role.created': record => createGenericTemplate('role.created', record),
  'role.updated': record => createGenericTemplate('role.updated', record)
};

const createEmailTemplate = (event, record) => (templates[event] || ((value) => createGenericTemplate(event, value)))(record);

module.exports = { createEmailTemplate, templates };