/**
 * WhatsApp Notification Service for EggKart by AP Enterprises
 * Supports:
 * 1. Meta WhatsApp Cloud API (Official)
 * 2. Twilio WhatsApp API
 * 3. Graceful Simulation / Fallback Mode (Logs formatted messages in console when credentials are not configured)
 */

const formatPhoneWithCountryCode = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`; // Default to India (+91)
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
};

const buildBuyerOrderMessage = (order) => {
  const orderId = String(order._id || '').slice(-6).toUpperCase();
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `• *${item.name || 'Product'}* x ${item.quantity} ${item.unit || 'units'} - ₹${Number(item.lineTotal || 0).toLocaleString('en-IN')}`
    )
    .join('\n');

  const addr = order.deliveryAddress || order.deliveryAddressDetails || {};
  const addressStr = [
    addr.addressLine1 || addr.street || order.shippingAddress,
    addr.city,
    addr.state ? `${addr.state} - ${addr.pincode || addr.postalCode || ''}` : ''
  ]
    .filter(Boolean)
    .join(', ');

  const paymentStatusDisplay =
    order.paymentStatus === 'PAID'
      ? '✅ PAID (Online / Advance)'
      : order.paymentStatus === 'PARTIALLY_PAID'
      ? `🟡 Partially Paid (Due: ₹${Number(order.amountDue || 0).toLocaleString('en-IN')})`
      : `⏳ DUE on Delivery (₹${Number(order.totalAmount || 0).toLocaleString('en-IN')})`;

  return (
    `🛒 *Order Confirmed! — EggKart by AP Enterprises*\n\n` +
    `Hello *${order.customerName || 'Wholesale Buyer'}*,\n` +
    `Thank you for your order! We have received your wholesale request and our warehouse team is preparing it.\n\n` +
    `📦 *Order ID:* #${orderId}\n` +
    `📅 *Order Date:* ${dateStr}\n\n` +
    `📋 *Order Summary:*\n` +
    `${itemsList}\n\n` +
    `💵 *Subtotal:* ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}\n` +
    (order.deliveryFee ? `🚚 *Delivery Fee:* ₹${Number(order.deliveryFee).toLocaleString('en-IN')}\n` : '') +
    (order.discount ? `🏷️ *Discount:* -₹${Number(order.discount).toLocaleString('en-IN')}\n` : '') +
    `💰 *Total Amount:* *₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}*\n` +
    `💳 *Payment:* ${paymentStatusDisplay}\n\n` +
    `📍 *Delivery Address:*\n${addressStr}\n\n` +
    `🚚 *Current Status:* Processing (Dispatched soon)\n\n` +
    `Need help or quick adjustments? Reply directly to this message or contact AP Enterprises Wholesale Support.`
  );
};

const buildAdminOrderAlert = (order, buyer = {}) => {
  const orderId = String(order._id || '').slice(-6).toUpperCase();
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `• *${item.name || 'Product'}* — *${item.quantity} ${item.unit || 'units'}* (₹${Number(item.lineTotal || 0).toLocaleString('en-IN')})`
    )
    .join('\n');

  const addr = order.deliveryAddress || order.deliveryAddressDetails || {};
  const addressStr = [
    addr.addressLine1 || addr.street || order.shippingAddress,
    addr.addressLine2,
    addr.city,
    addr.state ? `${addr.state} - ${addr.pincode || addr.postalCode || ''}` : ''
  ]
    .filter(Boolean)
    .join(', ');

  const buyerName = order.customerName || buyer.name || 'Buyer';
  const buyerCompany = buyer.companyName || (typeof order.buyer === 'object' && order.buyer?.companyName) || '';
  const buyerPhone = order.phoneNumber || addr.phone || buyer.phone || 'N/A';

  return (
    `🚨 *NEW WHOLESALE ORDER RECEIVED!*\n` +
    `--------------------------------------\n` +
    `📦 *Order ID:* #${orderId}\n` +
    `🕒 *Time:* ${dateStr}\n\n` +
    `👤 *Customer:* ${buyerName}${buyerCompany ? ` (${buyerCompany})` : ''}\n` +
    `📞 *Phone:* +${formatPhoneWithCountryCode(buyerPhone)}\n\n` +
    `📋 *ITEMS TO PACK:*\n` +
    `${itemsList}\n\n` +
    `💰 *Total Bill:* *₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}*\n` +
    `💳 *Payment Status:* ${order.paymentStatus || 'DUE'}\n\n` +
    `📍 *Deliver To:*\n${addressStr}\n` +
    (order.notes ? `\n📝 *Order Notes:* ${order.notes}\n` : '') +
    `--------------------------------------\n` +
    `⚡ Open Admin Portal to assign dispatch driver or update status.`
  );
};

const buildOrderStatusUpdateMessage = (order, newStatus) => {
  const orderId = String(order._id || '').slice(-6).toUpperCase();
  const statusFormatted = String(newStatus || '').toUpperCase();

  let statusEmoji = '📦';
  let statusDetail = 'Your order is being processed.';

  if (statusFormatted === 'PACKED') {
    statusEmoji = '📦';
    statusDetail = 'Your items have been verified, packed and sealed at our warehouse.';
  } else if (statusFormatted === 'SHIPPED' || statusFormatted === 'DISPATCHED') {
    statusEmoji = '🚚';
    statusDetail = 'Your order has been dispatched for delivery and is on its way!';
  } else if (statusFormatted === 'DELIVERED') {
    statusEmoji = '✅';
    statusDetail = 'Your wholesale order has been successfully delivered. Thank you for doing business with AP Enterprises!';
  } else if (statusFormatted === 'CANCELLED') {
    statusEmoji = '❌';
    statusDetail = 'Your order has been cancelled. If you have any questions, please contact AP Enterprises support.';
  }

  return (
    `${statusEmoji} *Order Update #${orderId} — ${statusFormatted}*\n\n` +
    `Hello *${order.customerName || 'Valued Customer'}*,\n\n` +
    `${statusDetail}\n\n` +
    `📦 *Order ID:* #${orderId}\n` +
    `💰 *Total Amount:* ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}\n\n` +
    `Thank you,\n*EggKart by AP Enterprises*`
  );
};

/**
 * Low-level sender supporting Meta Cloud API, Twilio, or Mock logging
 */
const sendWhatsAppRaw = async (toPhone, messageBody) => {
  const formattedPhone = formatPhoneWithCountryCode(toPhone);
  if (!formattedPhone) {
    console.warn('[WhatsApp Service] Invalid or missing recipient phone number:', toPhone);
    return false;
  }

  const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();

  // 1. Meta WhatsApp Cloud API
  if (provider === 'meta_cloud' && process.env.META_WHATSAPP_PHONE_NUMBER_ID && process.env.META_WHATSAPP_ACCESS_TOKEN) {
    try {
      const url = `https://graph.facebook.com/v19.0/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { preview_url: false, body: messageBody }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Meta WhatsApp Cloud API Error]', data);
        return false;
      }
      console.log(`[WhatsApp Sent via Meta] To: +${formattedPhone}, ID:`, data.messages?.[0]?.id);
      return true;
    } catch (err) {
      console.error('[WhatsApp Network Error]', err.message);
      return false;
    }
  }

  // 2. Twilio WhatsApp API
  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;

      const params = new URLSearchParams();
      params.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
      params.append('To', `whatsapp:+${formattedPhone}`);
      params.append('Body', messageBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Twilio WhatsApp Error]', data);
        return false;
      }
      console.log(`[WhatsApp Sent via Twilio] To: +${formattedPhone}, SID:`, data.sid);
      return true;
    } catch (err) {
      console.error('[Twilio WhatsApp Network Error]', err.message);
      return false;
    }
  }

  // 3. Fallback / Dev Mode
  console.log(`\n======================================================`);
  console.log(`📱 [WhatsApp Notification - Simulation/Dev Mode]`);
  console.log(`➡️ Recipient: +${formattedPhone}`);
  console.log(`------------------------------------------------------`);
  console.log(messageBody);
  console.log(`======================================================\n`);
  return true;
};

/**
 * Sends order confirmation message to buyer
 */
export const sendBuyerOrderWhatsApp = async (order) => {
  try {
    const buyerPhone = order.phoneNumber || order.deliveryAddress?.phone || order.buyer?.phone;
    if (!buyerPhone) return;

    const message = buildBuyerOrderMessage(order);
    await sendWhatsAppRaw(buyerPhone, message);
  } catch (error) {
    console.error('[WhatsApp Buyer Notification Error]', error.message);
  }
};

/**
 * Sends instant new order alert to Admin phone number
 */
export const sendAdminNewOrderWhatsApp = async (order, buyer = {}) => {
  try {
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || '919322000000';
    if (!adminPhone) return;

    const message = buildAdminOrderAlert(order, buyer);
    await sendWhatsAppRaw(adminPhone, message);
  } catch (error) {
    console.error('[WhatsApp Admin Notification Error]', error.message);
  }
};

/**
 * Sends order status update message to buyer (Dispatched, Delivered, etc.)
 */
export const sendOrderStatusUpdateWhatsApp = async (order, newStatus) => {
  try {
    const buyerPhone = order.phoneNumber || order.deliveryAddress?.phone || order.buyer?.phone;
    if (!buyerPhone) return;

    const message = buildOrderStatusUpdateMessage(order, newStatus);
    await sendWhatsAppRaw(buyerPhone, message);
  } catch (error) {
    console.error('[WhatsApp Status Update Error]', error.message);
  }
};
