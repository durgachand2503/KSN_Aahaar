/* ═══════════════════════════════════════════
   KSN AAHAAR — WhatsApp Notification Service

   MVP approach: Generates WhatsApp deep links.
   For automated server-side messages, integrate
   Meta Business API or Twilio in the future.
   ═══════════════════════════════════════════ */

import { config } from '../config';

interface OrderNotificationData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  total: number;
  items: { productName: string; variantName: string; quantity: number }[];
  deliveryAddress?: {
    houseFlat: string;
    street: string;
    area: string;
    city: string;
    pincode: string;
  };
}

/**
 * Generate a WhatsApp notification message for a new order.
 * In the MVP, this produces a deep link the owner can tap to send the message.
 * In production, replace with a Meta Business API or Twilio integration.
 */
export function notifyNewOrder(data: OrderNotificationData): void {
  const itemsList = data.items
    .map((item) => `  • ${item.productName} (${item.variantName}) × ${item.quantity}`)
    .join('\n');

  const addressLine = data.orderType === 'delivery' && data.deliveryAddress
    ? `\n📍 Address: ${data.deliveryAddress.houseFlat}, ${data.deliveryAddress.street}, ${data.deliveryAddress.area}, ${data.deliveryAddress.city} - ${data.deliveryAddress.pincode}`
    : '\n🏪 Order Type: Self Pickup';

  const message = [
    `🔔 *NEW ORDER — ${data.orderId}*`,
    ``,
    `👤 ${data.customerName}`,
    `📱 ${data.customerPhone}`,
    addressLine,
    ``,
    `🛒 Items:`,
    itemsList,
    ``,
    `💰 Total: ₹${data.total.toLocaleString('en-IN')}`,
  ].join('\n');

  // Generate deep link for the owner to send the WhatsApp message manually.
  // TODO: Replace with Meta Business API for automated notifications.
  const ownerPhone = config.whatsapp?.ownerPhone || '';
  if (ownerPhone) {
    const encodedMsg = encodeURIComponent(message);
    const deepLink = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
    // Only log the deep link (not message content) in non-production environments.
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[WhatsApp] New order ${data.orderId} — deep link generated.`);
      console.info(`[WhatsApp] Link: ${deepLink}`);
    }
  }
}

/**
 * Generate a status update notification message for the customer.
 */
export function notifyStatusUpdate(
  orderId: string,
  customerPhone: string,
  newStatus: string,
  customerName?: string
): void {
  const statusMessages: Record<string, string> = {
    accepted: '✅ Your order has been accepted! Our kitchen is getting ready.',
    preparing: '👨‍🍳 Great news! Your order is now being prepared.',
    ready: '📦 Your order is ready! It will be dispatched / available for pickup shortly.',
    out_for_delivery: '🛵 Your order is out for delivery! Our delivery partner is on the way. Stay nearby!',
    delivered: '🎉 Your order has been delivered! Enjoy your meal. Thank you for choosing KSN AAHAAR! 🍽️',
    cancelled: '❌ Your order has been cancelled. Contact us at +91 79938 77507 for any queries.',
  };

  const statusMsg = statusMessages[newStatus] || `Order status updated to: ${newStatus}`;
  const greeting = customerName ? `Hi ${customerName},\n\n` : '';

  const message = [
    `*KSN AAHAAR — Order Update*`,
    ``,
    `${greeting}Order ID: *${orderId}*`,
    ``,
    statusMsg,
    ``,
    newStatus !== 'delivered' && newStatus !== 'cancelled'
      ? `Track: https://ksnaahaar.com/order/${orderId}`
      : '',
  ].filter(Boolean).join('\n');

  // Generate deep link — admin taps this to send the status update via WhatsApp.
  // TODO: Replace with Meta Business API for automated notifications.
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const encoded = encodeURIComponent(message);
  const deepLink = `https://wa.me/${phone}?text=${encoded}`;

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[WhatsApp] Status update for order ${orderId} (${newStatus}) — deep link generated.`);
    console.info(`[WhatsApp] Link: ${deepLink}`);
  }
}

/**
 * Notify owner of a new contact form submission.
 */
export function notifyContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): void {
  const ownerPhone = config.whatsapp?.ownerPhone || '';
  if (!ownerPhone) return;

  const text = [
    `📩 *New Contact Message — KSN AAHAAR*`,
    ``,
    `👤 Name: ${data.name}`,
    `📧 Email: ${data.email}`,
    data.phone ? `📱 Phone: ${data.phone}` : '',
    ``,
    `💬 Message:`,
    data.message,
  ].filter(l => l !== undefined).join('\n');

  const encoded = encodeURIComponent(text);
  const deepLink = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encoded}`;

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[WhatsApp] Contact form from ${data.name} <${data.email}> — deep link generated.`);
    console.info(`[WhatsApp] Link: ${deepLink}`);
  }
}
