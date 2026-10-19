import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * AP ENTERPRISES - Transactional Email Notification Service
 * Premium B2B Wholesale Commerce email template engine.
 */

export const createMailTransport = () => {
  if (!env.smtp.user || !env.smtp.pass) {
    return null;
  }

  const isGmail = (env.smtp.host && env.smtp.host.includes('gmail')) || env.smtp.user.includes('@gmail.com');
  const port = Number(env.smtp.port || (env.smtp.secure ? 465 : 587));
  const isSecure = port === 465;

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: env.smtp.user.trim(),
          pass: env.smtp.pass.trim()
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000
      }
    : {
        host: env.smtp.host || 'smtp.gmail.com',
        port,
        secure: isSecure,
        auth: {
          user: env.smtp.user.trim(),
          pass: env.smtp.pass.trim()
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000
      };

  return nodemailer.createTransport(transportConfig);
};

export const mailTransport = createMailTransport();

const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

export const AP_LOGO_URL = 'https://res.cloudinary.com/dxli2mlbq/image/upload/v1792425357/ap_enterprises_branding/logo.jpg';

const getStatusConfig = (status) => {
  switch (status) {
    case 'pending':
      return {
        badgeLabel: 'Order Received',
        badgeBg: '#FFFBEB',
        badgeColor: '#92400E',
        badgeBorder: '#FDE68A',
        headline: 'Your wholesale order has been received.',
        subtext: 'We are preparing your items for warehouse dispatch.'
      };
    case 'packed':
      return {
        badgeLabel: 'Order Packed',
        badgeBg: '#EFF6FF',
        badgeColor: '#1D4ED8',
        badgeBorder: '#BFDBFE',
        headline: 'Your order has been packed and staged.',
        subtext: 'Your products have been packed and are ready for dispatch.'
      };
    case 'shipped':
      return {
        badgeLabel: 'Order Dispatched',
        badgeBg: '#E0F2FE',
        badgeColor: '#0284C7',
        badgeBorder: '#BAE6FD',
        headline: 'Your order is on the way!',
        subtext: 'Your bulk wholesale order has been dispatched and is en route.'
      };
    case 'delivered':
      return {
        badgeLabel: 'Order Delivered',
        badgeBg: '#ECFDF5',
        badgeColor: '#047857',
        badgeBorder: '#A7F3D0',
        headline: 'Your order has been delivered.',
        subtext: 'Thank you for choosing AP Enterprises as your wholesale supply partner.'
      };
    case 'cancelled':
      return {
        badgeLabel: 'Order Cancelled',
        badgeBg: '#FEF2F2',
        badgeColor: '#B91C1C',
        badgeBorder: '#FECACA',
        headline: 'Your order has been cancelled.',
        subtext: 'If you have questions regarding this cancellation, please contact support.'
      };
    default:
      return {
        badgeLabel: String(status || 'PROCESSING').toUpperCase(),
        badgeBg: '#F1F5F9',
        badgeColor: '#334155',
        badgeBorder: '#E2E8F0',
        headline: `Your order status has been updated to ${status}.`,
        subtext: 'Check your AP Enterprises app for live tracking.'
      };
  }
};

/**
 * Generates prominent, modern HTML for 6-digit OTP verification email with official AP Enterprises logo.
 */
export const generateOtpEmailHtml = ({ otp, expiryMinutes = 10 }) => {
  const cleanOtp = String(otp || '').replace(/\D/g, '');
  const displayDigits = (cleanOtp.length === 6 ? cleanOtp : String(otp || '').padEnd(6, '•')).slice(0, 6).split('');

  const digitsHtml = displayDigits
    .map(
      (digit) => `
        <td align="center" valign="middle" class="otp-cell" style="width: 42px; height: 52px; background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'SF Pro Display', monospace; font-size: 26px; font-weight: 800; color: #1d4ed8; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);">
          ${digit}
        </td>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>AP Enterprises Verification Code</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0b1120 !important; }
      .card-box { background-color: #1e293b !important; border-color: #334155 !important; }
      .heading-text { color: #f8fafc !important; }
      .body-text { color: #94a3b8 !important; }
      .otp-cell { background-color: #0f172a !important; border-color: #3b82f6 !important; color: #60a5fa !important; }
      .footer-box { background-color: #0f172a !important; border-color: #334155 !important; }
      .footer-text { color: #64748b !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="card-box" style="max-width: 480px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);">
          
          <!-- Header with AP Enterprises Logo -->
          <tr>
            <td style="padding: 36px 30px 20px 30px; text-align: center;">
              <!-- AP Enterprises Official Brand Logo -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center">
                    <img src="${AP_LOGO_URL}" alt="AP Enterprises" width="76" height="76" style="display: block; width: 76px; height: 76px; border-radius: 14px; object-fit: contain; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);" />
                  </td>
                </tr>
              </table>

              <h1 class="heading-text" style="margin: 0 0 3px 0; color: #0f172a; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">
                AP ENTERPRISES
              </h1>
              <p style="margin: 0; color: #64748b; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Wholesale Beverages &bull; Eggs &bull; Supplies
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="border-top: 1px solid #f1f5f9; width: 100%;"></div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 30px 24px 30px; text-align: center;">
              <!-- Security Badge Pill -->
              <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #dbeafe; padding: 5px 14px; border-radius: 20px; margin-bottom: 18px;">
                <span style="color: #1d4ed8; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;">
                  SECURITY VERIFICATION
                </span>
              </div>

              <h2 class="heading-text" style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 800; letter-spacing: -0.4px;">
                Verify Your Account
              </h2>
              <p class="body-text" style="margin: 0 auto 24px auto; color: #475569; font-size: 14px; line-height: 1.5; max-width: 360px;">
                Use the 6-digit verification code below to verify your business wholesale account:
              </p>

              <!-- 6-DIGIT OTP TILES (Guaranteed Never to Wrap) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 22px auto; border-collapse: separate; border-spacing: 6px;">
                <tr>
                  ${digitsHtml}
                </tr>
              </table>

              <!-- Expiry Alert -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; max-width: 360px; width: 100%;">
                <tr>
                  <td style="padding: 10px 14px; text-align: center;">
                    <span style="font-size: 12.5px; color: #92400e; font-weight: 600; vertical-align: middle;">
                      This code expires in <strong>${expiryMinutes} minutes</strong>
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11.5px; color: #94a3b8; line-height: 1.5;">
                <strong>Security Notice:</strong> AP Enterprises staff will never ask for your verification code. Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-box" style="padding: 22px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p class="footer-text" style="margin: 0 0 6px 0; font-size: 11.5px; color: #64748b;">
                If you did not request this verification, you can safely ignore this email.
              </p>
              <p class="footer-text" style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AP Enterprises &bull; Wholesale Distribution
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
 * Sends 6-digit registration OTP verification email.
 */
export const sendRegistrationOtpEmail = async ({ email, otp, expiryMinutes = 10 }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const transport = createMailTransport();

  const subject = `${otp} is your AP Enterprises Verification Code`;
  const text = `AP Enterprises Verification Code\n\nYour 6-digit verification code is: ${otp}\nThis code is valid for ${expiryMinutes} minutes.\nNever share this code with anyone.\n\nThank you for choosing AP Enterprises.`;
  const html = generateOtpEmailHtml({ otp, expiryMinutes });

  if (!transport) {
    console.warn(`[OTP EMAIL] SMTP credentials missing in environment variables. Development OTP for ${cleanEmail} is: ${otp}`);
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('SMTP email service is not configured on server.');
      error.code = 'SMTP_NOT_CONFIGURED';
      throw error;
    }
    return { success: true, simulated: true };
  }

  try {
    const info = await transport.sendMail({
      from: `"AP Enterprises" <${env.smtp.user.trim()}>`,
      to: cleanEmail,
      subject,
      text,
      html
    });
    console.log(`[OTP EMAIL] Sent successfully to ${cleanEmail} (MessageID: ${info.messageId || 'OK'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[OTP EMAIL ERROR] Failed to send email to ${cleanEmail}:`, {
      message: error.message,
      code: error.code,
      command: error.command
    });
    console.log(`[DEV OTP BACKUP] Verification code for ${cleanEmail} is: ${otp}`);
    throw error;
  }
};

/**
 * Generates responsive HTML for transactional order updates with AP Enterprises logo.
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

  const itemsHtml = (items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${item.name}</div>
          <div style="color: #64748b; font-size: 12px;">Qty: ${item.quantity} ${item.unit || 'unit'}${item.quantity > 1 ? 's' : ''}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">
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
  <title>Order Update #${formattedOrderId} - AP Enterprises</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);">
          <tr>
            <td style="background-color: #0f172a; padding: 24px 30px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle; width: 56px;">
                    <img src="${AP_LOGO_URL}" alt="AP Enterprises" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 10px; object-fit: contain; background: #ffffff;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 14px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 0.5px;">AP ENTERPRISES</h1>
                    <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">Order Status: #${formattedOrderId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: ${cfg.badgeBg}; border: 1px solid ${cfg.badgeBorder}; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 4px 0; color: ${cfg.badgeColor}; font-size: 16px; font-weight: 800;">${cfg.headline}</h3>
                <p style="margin: 0; color: ${cfg.badgeColor}; font-size: 13px;">${cfg.subtext}</p>
              </div>
              <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 800;">Items Ordered</h4>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemsHtml}
                <tr>
                  <td style="padding: 14px 0 0 0; font-weight: 800; color: #0f172a; font-size: 15px;">Total Amount:</td>
                  <td style="padding: 14px 0 0 0; text-align: right; font-weight: 900; color: #1d4ed8; font-size: 17px;">${formatCurrency(totalAmount)}</td>
                </tr>
              </table>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;"><strong>Delivery Address:</strong> ${shippingAddress || 'On file'}</p>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;"><strong>Contact Phone:</strong> ${phoneNumber || 'On file'}</p>
                ${notes ? `<p style="margin: 0; font-size: 12px; color: #b45309;"><strong>Notes:</strong> ${notes}</p>` : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} AP Enterprises &bull; Wholesale Distribution</p>
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
  phoneNumber,
  notes
}) => {
  const cfg = getStatusConfig(status);
  const formattedOrderId = String(orderId || '').slice(-6).toUpperCase();
  const itemList = (items || [])
    .map((i) => `- ${i.name} x ${i.quantity} @ ${formatCurrency(i.unitPrice)} = ${formatCurrency(i.lineTotal || i.unitPrice * i.quantity)}`)
    .join('\n');

  return `
AP ENTERPRISES - WHOLESALE SUPPLY
Order Reference: #${formattedOrderId}
Status: ${cfg.badgeLabel}

Dear ${customerName || 'Valued Customer'},

${cfg.headline}
${cfg.subtext}

ORDER SUMMARY:
Order Date: ${new Date(orderDate).toLocaleDateString()}
Grand Total: ${formatCurrency(totalAmount)}

ITEMS:
${itemList}

DELIVERY DETAILS:
Recipient: ${customerName || 'On file'}
Phone: ${phoneNumber || 'On file'}
Address: ${shippingAddress || 'On file'}${notes ? `\nNotes: ${notes}` : ''}

Thank you for choosing AP Enterprises as your wholesale supply partner.
  `.trim();
};

/**
 * Sends a transactional order status email to the registered buyer.
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
  const formattedOrderId = String(order._id || '').slice(-6).toUpperCase();
  const subject = `AP Enterprises: Order #${formattedOrderId} - ${cfg.badgeLabel}`;
  const html = renderOrderEmailHtml(orderData);
  const text = renderOrderEmailText(orderData);

  const transport = createMailTransport();
  if (!transport) {
    console.log(`[DEV EmailService SIMULATION] Would send "${subject}" to ${recipientEmail}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transport.sendMail({
      from: `"AP Enterprises" <${env.smtp.user.trim()}>`,
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

/**
 * Sends a detailed order notification email to the business administrator with AP Enterprises logo.
 */
export const sendAdminNewOrderNotification = async ({ order, buyer }) => {
  const rawAdmin = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    env.admin.email ||
    process.env.ADMIN_EMAIL ||
    'apenterprises.eggkart@gmail.com'
  ).trim().toLowerCase();
  const adminEmail = rawAdmin.includes('aniket.singh07vs') ? 'apenterprises.eggkart@gmail.com' : rawAdmin;

  if (!adminEmail) {
    console.warn('[EmailService] Admin email not configured. Skipping admin order email.');
    return { success: false, reason: 'Admin email not configured' };
  }

  const orderId = String(order._id || '').slice(-6).toUpperCase();
  const buyerName = buyer?.name || order.customerName || 'Wholesale Buyer';
  const buyerCompany = buyer?.companyName || 'Not specified';
  const buyerPhone = order.phoneNumber || buyer?.phone || 'Not specified';
  const buyerEmail = buyer?.email || 'Not specified';

  const addr = order.deliveryAddress || order.deliveryAddressDetails || {};
  const addrLine1 = addr.addressLine1 || addr.street || order.shippingAddress || 'Not specified';
  const addrLine2 = addr.addressLine2 || '';
  const addrCity = addr.city || '';
  const addrState = addr.state || '';
  const addrPincode = addr.pincode || addr.postalCode || '';
  const addrNotes = addr.notes || order.notes || '';

  const totalAmount = Number(order.totalAmount || 0);
  const amountPaid = Number(order.amountPaid || 0);
  const amountDue = Number(order.amountDue !== undefined ? order.amountDue : Math.max(totalAmount - amountPaid, 0));
  const paymentStatus = order.paymentStatus || (amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'DUE');

  const items = order.items || [];
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">
          <strong>${item.name}</strong>
          ${item.category ? `<br/><span style="font-size: 11px; color: #64748b;">${item.category}${item.packSize ? ` • ${item.packSize}` : ''}</span>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: center;">
          ${item.quantity} ${item.unit || 'unit'}(s)
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: right;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0284c7; font-weight: 700; text-align: right;">
          ${formatCurrency(item.lineTotal || item.subtotal || item.unitPrice * item.quantity)}
        </td>
      </tr>`
    )
    .join('');

  const itemsText = items
    .map(
      (item) =>
        `- ${item.name} | Qty: ${item.quantity} ${item.unit || 'unit'}(s) | Price: ${formatCurrency(item.unitPrice)} | Subtotal: ${formatCurrency(item.lineTotal || item.subtotal || item.unitPrice * item.quantity)}`
    )
    .join('\n');

  const subject = `New Order Received - AP Enterprises - #${orderId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <tr>
      <td style="background-color: #0f172a; padding: 24px 30px; text-align: center;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
          <tr>
            <td align="center">
              <img src="${AP_LOGO_URL}" alt="AP Enterprises" width="52" height="52" style="display: block; width: 52px; height: 52px; border-radius: 10px; object-fit: contain; background: #ffffff;" />
            </td>
          </tr>
        </table>
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">AP ENTERPRISES</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Admin Order Notification</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 30px;">
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
          <h2 style="color: #166534; margin: 0 0 4px; font-size: 16px; font-weight: 700;">New Wholesale Order Received</h2>
          <p style="color: #15803d; margin: 0; font-size: 13px;">Order <strong>#${orderId}</strong> was placed successfully and is ready for fulfillment.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Buyer Details</h3>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
            <tr><td width="35%" style="color: #64748b;">Buyer Name:</td><td style="color: #0f172a; font-weight: 600;">${buyerName}</td></tr>
            <tr><td style="color: #64748b;">Company / Store:</td><td style="color: #0f172a; font-weight: 600;">${buyerCompany}</td></tr>
            <tr><td style="color: #64748b;">Phone:</td><td style="color: #0f172a; font-weight: 600;">${buyerPhone}</td></tr>
            <tr><td style="color: #64748b;">Email:</td><td style="color: #0f172a; font-weight: 600;">${buyerEmail}</td></tr>
          </table>
        </div>

        <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Ordered Products</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0;">Product</th>
              <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
              <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
              <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right; border-bottom: 1px solid #e2e8f0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Payment Summary</h3>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
            <tr><td style="color: #64748b;">Subtotal:</td><td style="text-align: right; color: #0f172a; font-weight: 600;">${formatCurrency(order.subtotal || totalAmount)}</td></tr>
            <tr><td style="color: #64748b;">Delivery Charges:</td><td style="text-align: right; color: #16a34a; font-weight: 600;">${order.deliveryFee ? formatCurrency(order.deliveryFee) : 'FREE'}</td></tr>
            <tr><td style="color: #64748b;">Amount Paid:</td><td style="text-align: right; color: #16a34a; font-weight: 600;">${formatCurrency(amountPaid)}</td></tr>
            <tr><td style="color: #64748b;">Amount Due:</td><td style="text-align: right; color: #dc2626; font-weight: 600;">${formatCurrency(amountDue)}</td></tr>
            <tr style="border-top: 1px solid #cbd5e1;"><td style="color: #0f172a; font-weight: 800; font-size: 14px; padding-top: 8px;">Total Order Amount:</td><td style="text-align: right; color: #0284c7; font-weight: 800; font-size: 16px; padding-top: 8px;">${formatCurrency(totalAmount)}</td></tr>
            <tr><td style="color: #64748b;">Payment Status:</td><td style="text-align: right; font-weight: 700; color: ${paymentStatus === 'PAID' ? '#16a34a' : paymentStatus === 'PARTIALLY_PAID' ? '#d97706' : '#dc2626'};">${paymentStatus}</td></tr>
          </table>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Delivery Location</h3>
          <p style="margin: 0 0 4px; font-size: 13px; color: #0f172a; font-weight: 600;">${addr.contactName || buyerName} (${addr.phone || buyerPhone})</p>
          <p style="margin: 0 0 2px; font-size: 13px; color: #334155;">${addrLine1}</p>
          ${addrLine2 ? `<p style="margin: 0 0 2px; font-size: 13px; color: #334155;">${addrLine2}</p>` : ''}
          <p style="margin: 0 0 2px; font-size: 13px; color: #334155;">${[addrCity, addrState, addrPincode].filter(Boolean).join(', ')}</p>
          ${addrNotes ? `<p style="margin: 6px 0 0; font-size: 12px; color: #b45309; background-color: #fef3c7; padding: 6px 10px; border-radius: 6px;">Note: ${addrNotes}</p>` : ''}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} AP Enterprises &bull; Wholesale Order Dispatch System</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
New wholesale order received.

Order ID:
#${orderId}

Buyer:
${buyerName}

Company/Store:
${buyerCompany}

Phone:
${buyerPhone}

Email:
${buyerEmail}

--------------------------------

Ordered Products:

${itemsText}

--------------------------------

Subtotal:
${formatCurrency(order.subtotal || totalAmount)}

Delivery Fee:
${order.deliveryFee ? formatCurrency(order.deliveryFee) : 'FREE'}

Total:
${formatCurrency(totalAmount)}

Amount Paid:
${formatCurrency(amountPaid)}

Amount Due:
${formatCurrency(amountDue)}

Payment Status:
${paymentStatus}

--------------------------------

Delivery Address:

${addrLine1}
${addrLine2 ? addrLine2 + '\n' : ''}${addrCity}, ${addrState} - ${addrPincode}

Delivery Notes:
${addrNotes || 'None'}
  `.trim();

  const transport = createMailTransport();
  if (!transport) {
    console.log(`[DEV EmailService SIMULATION] Would send Admin Order Notification "${subject}" to ${adminEmail}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transport.sendMail({
      from: `"AP Enterprises Orders" <${env.smtp.user.trim()}>`,
      to: adminEmail,
      subject,
      text,
      html
    });
    console.log(`[EmailService] Admin new order notification sent to ${adminEmail} (${info.messageId || 'OK'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send admin order notification to ${adminEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

