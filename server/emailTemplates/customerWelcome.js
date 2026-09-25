const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const createCustomerWelcomeEmail = (customer) => {
  const name = escapeHtml(customer.name || 'there');
  const customerId = escapeHtml(customer.customerId || customer.id || '');
  const dateAdded = escapeHtml(customer.dateAdded || '');
  const phone = escapeHtml(customer.phone || '');

  return {
    subject: 'Welcome to Om Srinivas Boutique',
    text: `Hello ${customer.name || 'there'},\n\nWelcome to Om Srinivas Boutique. Your customer profile has been created successfully.\n\nCustomer ID: ${customer.customerId || customer.id || ''}\n${customer.phone ? `Phone: ${customer.phone}\n` : ''}${customer.dateAdded ? `Profile date: ${customer.dateAdded}\n` : ''}\nWe look forward to creating something beautiful for you.\n\nOm Srinivas Boutique`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Welcome to Om Srinivas Boutique</title>
  </head>
  <body style="margin:0;background:#fff7f8;color:#3d3034;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #efd8dc;">
            <tr>
              <td style="background:#9d3f58;padding:30px 36px;text-align:center;">
                <div style="color:#f5d78e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Om Srinivas Boutique</div>
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:28px;font-weight:600;">Welcome, ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Your customer profile is now ready. We are delighted to have you with us.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#fffaf0;border-left:4px solid #d4a84f;">
                  <tr><td style="padding:18px 20px;font-size:14px;line-height:1.8;">
                    <strong style="color:#9d3f58;">Your profile details</strong><br>
                    Customer ID: <strong>${customerId}</strong><br>
                    ${phone ? `Phone: ${phone}<br>` : ''}
                    ${dateAdded ? `Profile date: ${dateAdded}` : ''}
                  </td></tr>
                </table>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">From bespoke fittings to final finishing, our team is here to make every detail feel just right.</p>
                <p style="margin:24px 0 0;font-size:16px;line-height:1.7;">Warmly,<br><strong style="color:#9d3f58;">The Om Srinivas Boutique Team</strong></p>
              </td>
            </tr>
            <tr>
              <td style="background:#3d3034;padding:20px 36px;color:#f8e9eb;text-align:center;font-size:12px;line-height:1.6;">
                Bespoke tailoring and couture<br>
                Please do not reply to this automated message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  };
};

module.exports = { createCustomerWelcomeEmail };
