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
 * In the MVP, we log this to the console. In production,
 * this would send via Meta Business API or Twilio.
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

  // Log for now — replace with actual API call for production
  console.log('\n═══ WhatsApp Notification ═══');
  console.log(message);
  console.log('═════════════════════════════\n');

  // Generate deep link for manual notification (useful for testing)
  const ownerPhone = config.whatsapp?.ownerPhone || '';
  if (ownerPhone) {
    const encodedMsg = encodeURIComponent(message);
    const deepLink = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
    console.log('📲 WhatsApp deep link:', deepLink, '\n');
  }
}

/**
 * Generate a status update notification message.
 */
export function notifyStatusUpdate(
  orderId: string,
  customerPhone: string,
  newStatus: string
): void {
  const statusMessages: Record<string, string> = {
    accepted: '✅ Your order has been accepted by our kitchen!',
    preparing: '👨‍🍳 Your order is being prepared with love!',
    ready: '📦 Your order is ready!',
    out_for_delivery: '🛵 Your order is out for delivery!',
    delivered: '🎉 Your order has been delivered. Enjoy your meal!',
    cancelled: '❌ Your order has been cancelled. Contact us for any queries.',
  };

  const statusMsg = statusMessages[newStatus] || `Order status updated to: ${newStatus}`;

  const message = [
    `*KSN AAHAAR — Order Update*`,
    ``,
    `Order: ${orderId}`,
    statusMsg,
    ``,
    `Track: https://ksnaahaar.com/order/${orderId}`,
  ].join('\n');

  console.log('\n═══ Status Update Notification ═══');
  console.log(`To: ${customerPhone}`);
  console.log(message);
  console.log('══════════════════════════════════\n');
}
