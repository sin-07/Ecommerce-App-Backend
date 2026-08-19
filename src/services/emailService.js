import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * AP ENTERPRISES - Transactional Email Notification Service
 * Premium B2B Beverage Supply email template engine.
 */

export const mailTransport = env.smtp.user && env.smtp.pass
  ? nodemailer.createTransport({
      host: env.smtp.host || 'smtp.gmail.com',
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    })
  : null;

const formatCurrency = (val) => `$${Number(val || 0).toFixed(2)}`;

const getStatusConfig = (status) => {
  switch (status) {
    case 'pending':
      return {
        badgeLabel: 'Order Received',
        badgeBg: '#FFFBEB',
        badgeColor: '#92400E',
        badgeBorder: '#FDE68A',
        iconEmoji: '📋',
        headline: 'Your beverage order has been received.',
        subtext: 'We are preparing your wholesale order for fulfillment.'
      };
    case 'packed':
      return {
        badgeLabel: 'Order Packed',
        badgeBg: '#EFF6FF',
        badgeColor: '#1D4ED8',
        badgeBorder: '#BFDBFE',
        iconEmoji: '📦',
        headline: 'Your order has been packed & staged.',
        subtext: 'Your beverage cases have been packed and are ready for dock dispatch.'
      };
    case 'shipped':
      return {
        badgeLabel: 'Order Dispatched',
        badgeBg: '#E0F2FE',
        badgeColor: '#0284C7',
        badgeBorder: '#BAE6FD',
        iconEmoji: '🚚',
        headline: 'Your order is on the way!',
        subtext: 'Your bulk beverage order has been dispatched and is en route to your delivery address.'
      };
    case 'delivered':
      return {
        badgeLabel: 'Order Delivered',
        badgeBg: '#ECFDF5',
        badgeColor: '#047857',
        badgeBorder: '#A7F3D0',
        iconEmoji: '✅',
        headline: 'Your order has been delivered.',
        subtext: 'Thank you for choosing AP Enterprises as your wholesale beverage supply partner!'
      };
    case 'cancelled':
      return {
        badgeLabel: 'Order Cancelled',
        badgeBg: '#FEF2F2',
        badgeColor: '#B91C1C',
        badgeBorder: '#FECACA',
        iconEmoji: '⚠️',
        headline: 'Your order has been cancelled.',
        subtext: 'If you have questions regarding this cancellation, please contact our support team.'
      };
    default:
      return {
        badgeLabel: status.toUpperCase(),
        badgeBg: '#F1F5F9',
        badgeColor: '#334155',
        badgeBorder: '#E2E8F0',
        iconEmoji: '📄',
        headline: `Your order status has been updated to ${status}.`,
        subtext: 'Check your AP Enterprises portal for live tracking.'
      };
  }
};

/**
 * Generates responsive, Outlook & Gmail safe HTML for transactional order updates.
 */
export const renderOrderEmailHtml = ({
  customerName,
  orderId,
  orderDate,
  items,
  totalAmount,
  status,
  shippingAddress,
  phoneNumber,
  notes
}) => {
  const cfg = getStatusConfig(status);
  const formattedOrderId = String(orderId || '').slice(-6).toUpperCase();
  const formattedDate = new Date(orderDate || Date.now()).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const itemsRows = (items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 700; vertical-align: top;">
        ${item.name}
        <div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">Beverage Supply • Case pack</div>
      </td>
      <td align="center" style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; font-weight: 600; vertical-align: top;">
        ${item.quantity} cs
      </td>
      <td align="right" style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; vertical-align: top;">
        ${formatCurrency(item.unitPrice)}
      </td>
      <td align="right" style="padding: 14px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 800; vertical-align: top;">
        ${formatCurrency(item.lineTotal || item.unitPrice * item.quantity)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AP Enterprises Order Notification</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .mobile-padding { padding-left: 18px !important; padding-right: 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">

  <!-- PREHEADER TEXT -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    AP Enterprises order update for #${formattedOrderId}: ${cfg.headline}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- MAIN CONTAINER -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 30px; text-align: left;" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                      BEVERAGE SUPPLY
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
                      AP ENTERPRISES
                    </h1>
                    <p style="margin: 3px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 500;">
                      Wholesale Beverage Distribution Platform
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 800; text-align: center;">
                      <span style="color: #94a3b8; font-size: 10px; display: block; font-weight: 600;">ORDER REF</span>
                      #${formattedOrderId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STATUS HIGHLIGHT BANNER -->
          <tr>
            <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 24px 30px;" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: ${cfg.badgeBg}; color: ${cfg.badgeColor}; border: 1px solid ${cfg.badgeBorder}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      ${cfg.iconEmoji} ${cfg.badgeLabel}
                    </div>
                    <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 19px; font-weight: 900; line-height: 1.3;">
                      ${cfg.headline}
                    </h2>
                    <p style="margin: 0 0 10px 0; color: #475569; font-size: 13.5px; line-height: 1.5;">
                      ${cfg.subtext}
                    </p>
                    <p style="margin: 0; color: #64748b; font-size: 12.5px;">
                      Account: <strong>${customerName || 'Wholesale Buyer'}</strong> &bull; Date: <strong>${formattedDate}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ORDER ITEMS TABLE -->
          <tr>
            <td style="padding: 26px 30px;" class="mobile-padding">
              <h3 style="margin: 0 0 14px 0; color: #0f172a; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px;">
                Wholesale Order Breakdown
              </h3>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th align="left" style="padding: 10px 10px; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Beverage Item</th>
                    <th align="center" style="padding: 10px 10px; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Cases</th>
                    <th align="right" style="padding: 10px 10px; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Case Price</th>
                    <th align="right" style="padding: 10px 10px; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- TOTALS SECTION -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
                <tr>
                  <td align="right" style="padding: 6px 10px; font-size: 13px; color: #64748b;">Subtotal:</td>
                  <td align="right" width="110" style="padding: 6px 10px; font-size: 14px; color: #1e293b; font-weight: 700;">${formatCurrency(totalAmount)}</td>
                </tr>
                <tr style="border-top: 2px solid #0f172a;">
                  <td align="right" style="padding: 12px 10px; font-size: 15px; color: #0f172a; font-weight: 900;">Grand Total:</td>
                  <td align="right" width="110" style="padding: 12px 10px; font-size: 19px; color: #1d4ed8; font-weight: 900;">${formatCurrency(totalAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DELIVERY & DISPATCH INFORMATION -->
          <tr>
            <td style="padding: 22px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;" class="mobile-padding">
              <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                🚚 Delivery & Shipping Information
              </h4>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 6px; font-size: 13px; color: #334155;">
                    <strong style="color: #0f172a;">Recipient:</strong> ${customerName || 'On file'}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px; font-size: 13px; color: #334155;">
                    <strong style="color: #0f172a;">Contact Phone:</strong> ${phoneNumber || 'On file'}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px; font-size: 13px; color: #334155;">
                    <strong style="color: #0f172a;">Destination Address:</strong> ${shippingAddress || 'On file'}
                  </td>
                </tr>
                ${
                  notes
                    ? `
                <tr>
                  <td style="font-size: 13px; color: #334155;">
                    <strong style="color: #0f172a;">Order Notes:</strong> ${notes}
                  </td>
                </tr>
                `
                    : ''
                }
              </table>
            </td>
          </tr>

          <!-- FOOTER & SUPPORT -->
          <tr>
            <td style="padding: 28px 30px; text-align: center; background-color: #ffffff;" class="mobile-padding">
              <p style="margin: 0 0 6px 0; font-size: 13.5px; color: #0f172a; font-weight: 800;">
                Need assistance with your wholesale delivery?
              </p>
              <p style="margin: 0 0 18px 0; font-size: 12.5px; color: #64748b;">
                Contact AP Enterprises B2B Dispatch Support: <a href="mailto:support@apenterprises.com" style="color: #1d4ed8; text-decoration: underline; font-weight: 600;">support@apenterprises.com</a>
              </p>
              <div style="height: 1px; background-color: #e2e8f0; margin: 16px 0;"></div>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 700;">
                AP ENTERPRISES &bull; PREMIUM B2B BEVERAGE SUPPLY
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AP Enterprises. All rights reserved. Wholesale Beverage Ordering & Distribution.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Plain-text fallback for order notifications.
 */
export const renderOrderEmailText = ({
  customerName,
  orderId,
  orderDate,
  items,
  totalAmount,
  status,
  shippingAddress,
  phoneNumber
}) => {
  const cfg = getStatusConfig(status);
  const formattedOrderId = String(orderId || '').slice(-6).toUpperCase();
  const itemList = (items || [])
    .map(
      (i) =>
        `- ${i.name} x ${i.quantity} cases @ ${formatCurrency(i.unitPrice)} = ${formatCurrency(
          i.lineTotal || i.unitPrice * i.quantity
        )}`
    )
    .join('\n');

  return `
AP ENTERPRISES - B2B BEVERAGE SUPPLY
Order Reference: #${formattedOrderId}
Status: ${cfg.badgeLabel}

Dear ${customerName || 'Valued Customer'},

${cfg.headline}
${cfg.subtext}

ORDER SUMMARY:
Order Date: ${new Date(orderDate).toLocaleDateString()}
Grand Total: ${formatCurrency(totalAmount)}

BEVERAGE ITEMS:
${itemList}

DELIVERY DETAILS:
Recipient: ${customerName || 'On file'}
Phone: ${phoneNumber || 'On file'}
Address: ${shippingAddress || 'On file'}

If you have any questions, please contact our support team at support@apenterprises.com.

Thank you for choosing AP Enterprises for your wholesale beverage supply!
  `.trim();
};

/**
 * Generates prominent HTML for 6-digit OTP verification email.
 */
export const generateOtpEmailHtml = ({ otp, expiryMinutes = 10 }) => {
  const spacedOtp = String(otp || '').split('').join(' ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - AP Enterprises</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);">
          
          <!-- HEADER -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 30px; text-align: left;">
              <div style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                SECURITY VERIFICATION
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900;">
                AP ENTERPRISES
              </h1>
              <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">
                Premium B2B Beverage Supply
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 32px 30px; text-align: center;">
              <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: 900;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                Please enter the 6-digit verification code below into the AP Enterprises mobile app to verify your wholesale account.
              </p>

              <!-- PROMINENT OTP BLOCK -->
              <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px 16px; margin: 20px 0; text-align: center;">
                <span style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; display: inline-block;">
                  ${spacedOtp}
                </span>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; font-weight: 600;">
                ⏱ This verification code will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Never share this code with anyone. AP Enterprises staff will never ask for your verification code.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11.5px; color: #64748b;">
                If you did not request this verification, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AP Enterprises &bull; Premium B2B Beverage Supply
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Sends a transactional order status email to the registered buyer.
 * Safe & non-blocking: catches errors so order processing is never interrupted.
 */
export const sendOrderEmailNotification = async ({ recipientEmail, customerName, order, status }) => {
  if (!recipientEmail) {
    console.warn('[EmailService] Recipient email is missing. Skipping email notification.');
    return { success: false, reason: 'Missing email' };
  }

  const orderData = {
    customerName: customerName || order.customerName,
    orderId: order._id,
    orderDate: order.createdAt || new Date(),
    items: order.items || [],
    totalAmount: order.totalAmount || 0,
    status: status || order.status || 'pending',
    shippingAddress: order.shippingAddress,
    phoneNumber: order.phoneNumber,
    notes: order.notes
  };

  const cfg = getStatusConfig(orderData.status);
  const subject = `AP Enterprises: Order #${String(order._id).slice(-6).toUpperCase()} ${cfg.badgeLabel}`;
  const html = renderOrderEmailHtml(orderData);
  const text = renderOrderEmailText(orderData);

  if (!mailTransport) {
    console.log(`[DEV EmailService SIMULATION] Would send "${subject}" to ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await mailTransport.sendMail({
      from: `"AP Enterprises" <${env.smtp.user}>`,
      to: recipientEmail,
      subject,
      text,
      html
    });
    console.log(`[EmailService] Order notification sent to ${recipientEmail} (${info.messageId || 'OK'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send order email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};
