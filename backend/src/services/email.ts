/* ═══════════════════════════════════════════
   KSN AAHAAR — Email Notification Service
   Uses Nodemailer with Gmail SMTP
   ═══════════════════════════════════════════ */

import nodemailer from 'nodemailer';
import { config } from '../config';

/* ── Create transporter lazily so missing env vars don't crash startup ── */
function getTransporter() {
  const user = config.email?.user;
  const pass = config.email?.pass;

  if (!user || !pass) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not configured — emails will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/* ── Contact Form Email ── */
export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const to = config.email?.to || config.email?.user || '';
  if (!to) return false;

  try {
    await transporter.sendMail({
      from: `"KSN AAHAAR Website" <${config.email!.user}>`,
      to,
      subject: `📩 New Contact Message from ${data.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f5f0;padding:24px;border-radius:12px;">
          <h2 style="color:#2d5a27;margin-top:0;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;color:#888;font-size:13px;width:120px;">Name</td><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;font-weight:600;">${data.name}</td></tr>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;color:#888;font-size:13px;">Email</td><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;"><a href="mailto:${data.email}" style="color:#2d5a27;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;color:#888;font-size:13px;">Phone</td><td style="padding:12px 16px;border-bottom:1px solid #f0e8da;">${data.phone}</td></tr>` : ''}
            <tr><td style="padding:12px 16px;color:#888;font-size:13px;vertical-align:top;">Message</td><td style="padding:12px 16px;white-space:pre-line;">${data.message}</td></tr>
          </table>
          <p style="font-size:12px;color:#aaa;margin-top:16px;text-align:center;">Sent via KSN AAHAAR contact form</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send contact email:', err);
    return false;
  }
}

/* ── Order Confirmation Email (to customer) ── */
export interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: { productName: string; variantName: string; quantity: number; subtotal: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderType: 'delivery' | 'pickup';
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter || !data.customerEmail) return false;

  const itemsRows = data.items.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8da;">${item.productName} (${item.variantName}) × ${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8da;text-align:right;">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  try {
    await transporter.sendMail({
      from: `"KSN AAHAAR" <${config.email!.user}>`,
      to: data.customerEmail,
      subject: `✅ Order Confirmed — ${data.orderId} | KSN AAHAAR`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f5f0;padding:24px;border-radius:12px;">
          <h2 style="color:#2d5a27;margin-top:0;">Order Confirmed! 🎉</h2>
          <p>Hi ${data.customerName}, your order <strong>${data.orderId}</strong> has been placed successfully.</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:16px 0;">
            ${itemsRows}
            <tr><td style="padding:8px 12px;color:#888;">Subtotal</td><td style="padding:8px 12px;text-align:right;">₹${data.subtotal.toLocaleString('en-IN')}</td></tr>
            ${data.discount > 0 ? `<tr><td style="padding:8px 12px;color:#4caf50;">Discount</td><td style="padding:8px 12px;text-align:right;color:#4caf50;">-₹${data.discount.toLocaleString('en-IN')}</td></tr>` : ''}
            ${data.orderType === 'delivery' && data.deliveryFee > 0 ? `<tr><td style="padding:8px 12px;color:#888;">Delivery Fee</td><td style="padding:8px 12px;text-align:right;color:#888;">₹${data.deliveryFee} (payable at delivery)</td></tr>` : ''}
            <tr style="background:#f0e8da;"><td style="padding:12px;font-weight:700;">Total</td><td style="padding:12px;text-align:right;font-weight:700;">₹${data.total.toLocaleString('en-IN')}</td></tr>
          </table>
          <a href="https://ksnaahaar.com/order/${data.orderId}" style="display:inline-block;background:#2d5a27;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Track Your Order</a>
          <p style="font-size:12px;color:#aaa;margin-top:24px;">KSN AAHAAR — Miyapur, Hyderabad | +91 79938 77507</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send order confirmation:', err);
    return false;
  }
}

/* ── Order Status Update Email (to customer) ── */

const STATUS_EMAIL_CONFIG: Record<string, { emoji: string; subject: string; headline: string; body: string; bgColor: string }> = {
  accepted: {
    emoji: '✅',
    subject: 'Order Accepted',
    headline: 'Your order has been accepted!',
    body: 'Great news! Our kitchen has accepted your order and will start preparing it soon.',
    bgColor: '#e8f5e9',
  },
  preparing: {
    emoji: '👨‍🍳',
    subject: 'Your food is being prepared',
    headline: 'We\'re cooking your order!',
    body: 'Our chefs are busy preparing your delicious meal with love and care.',
    bgColor: '#fff8e1',
  },
  ready: {
    emoji: '📦',
    subject: 'Your order is ready!',
    headline: 'Your order is ready for pickup / dispatch!',
    body: 'Your food is freshly prepared and packed. It will be handed over for delivery very shortly.',
    bgColor: '#e3f2fd',
  },
  out_for_delivery: {
    emoji: '🛵',
    subject: 'Your order is on the way!',
    headline: 'Out for delivery!',
    body: 'Your order is on its way to you. Our delivery partner will reach you soon. Please keep your phone handy.',
    bgColor: '#fff3e0',
  },
  delivered: {
    emoji: '🎉',
    subject: 'Order delivered — Enjoy your meal!',
    headline: 'Delivered! Bon appétit 🍽️',
    body: 'Your order has been delivered successfully. We hope you enjoy every bite! Thank you for choosing KSN AAHAAR.',
    bgColor: '#e8f5e9',
  },
  cancelled: {
    emoji: '❌',
    subject: 'Order Cancelled',
    headline: 'Your order has been cancelled',
    body: 'We\'re sorry, but your order has been cancelled. If you have any questions, please contact us.',
    bgColor: '#fce4ec',
  },
};

export interface StatusUpdateEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  newStatus: string;
  orderType: 'delivery' | 'pickup';
  note?: string;
}

export async function sendStatusUpdateEmail(data: StatusUpdateEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter || !data.customerEmail) return false;

  const cfg = STATUS_EMAIL_CONFIG[data.newStatus];
  if (!cfg) return false; // Don't send for statuses we don't have a template for

  try {
    await transporter.sendMail({
      from: `"KSN AAHAAR" <${config.email!.user}>`,
      to: data.customerEmail,
      subject: `${cfg.emoji} ${cfg.subject} — ${data.orderId} | KSN AAHAAR`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f5f0;padding:24px;border-radius:12px;">
          <div style="background:${cfg.bgColor};border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
            <p style="font-size:48px;margin:0;">${cfg.emoji}</p>
            <h2 style="color:#2d5a27;margin:12px 0 4px;">${cfg.headline}</h2>
            <p style="color:#555;margin:0;font-size:14px;">Order <strong>${data.orderId}</strong></p>
          </div>
          <p style="color:#444;font-size:15px;">Hi ${data.customerName},</p>
          <p style="color:#444;font-size:15px;">${cfg.body}</p>
          ${data.note ? `<div style="background:#fff;border-left:4px solid #2d5a27;padding:12px 16px;border-radius:4px;margin:16px 0;"><p style="margin:0;color:#555;font-size:14px;font-style:italic;">"${data.note}"</p></div>` : ''}
          ${data.newStatus === 'out_for_delivery' || data.newStatus === 'delivered'
            ? ''
            : `<a href="https://ksnaahaar.com/order/${data.orderId}" style="display:inline-block;background:#2d5a27;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0;">Track Your Order →</a>`
          }
          <hr style="border:none;border-top:1px solid #e8ddd0;margin:24px 0;" />
          <p style="font-size:12px;color:#aaa;margin:0;">KSN AAHAAR — Miyapur, Hyderabad | +91 79938 77507</p>
          <p style="font-size:12px;color:#aaa;margin:4px 0 0;">Questions? WhatsApp us: <a href="https://wa.me/917993877507" style="color:#2d5a27;">+91 79938 77507</a></p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send status update email:', err);
    return false;
  }
}

export interface AdminOrderAlertData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'delivery' | 'pickup';
  items: { productName: string; variantName: string; quantity: number; subtotal: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryAddress?: {
    houseFlat: string;
    street: string;
    area: string;
    city: string;
    pincode: string;
    instructions?: string;
  };
  couponCode?: string;
  notes?: string;
}

export async function sendAdminOrderAlert(data: AdminOrderAlertData): Promise<boolean> {
  const transporter = getTransporter();
  const to = config.email?.to || config.email?.user || '';
  if (!transporter || !to) return false;

  const itemsRows = data.items.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8da;">${item.productName} (${item.variantName}) × ${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8da;text-align:right;font-weight:600;">₹${item.subtotal.toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  const addressBlock = data.orderType === 'delivery' && data.deliveryAddress
    ? `<tr><td style="padding:8px 12px;color:#888;vertical-align:top;">Address</td><td style="padding:8px 12px;">
        ${data.deliveryAddress.houseFlat}, ${data.deliveryAddress.street}<br/>
        ${data.deliveryAddress.area}, ${data.deliveryAddress.city} — ${data.deliveryAddress.pincode}
        ${data.deliveryAddress.instructions ? `<br/><em style="color:#888;">${data.deliveryAddress.instructions}</em>` : ''}
      </td></tr>`
    : '';

  try {
    await transporter.sendMail({
      from: `"KSN AAHAAR Orders" <${config.email!.user}>`,
      to,
      subject: `🔔 New Order ${data.orderId} — ${data.customerName} (${data.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9f5f0;padding:24px;border-radius:12px;">
          <h2 style="color:#2d5a27;margin-top:0;">🔔 New Order — ${data.orderId}</h2>
          <p style="margin:0 0 16px;font-size:15px;">
            <strong>${data.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Self Pickup'}</strong>
            &nbsp;·&nbsp; <a href="tel:${data.customerPhone}" style="color:#2d5a27;">${data.customerPhone}</a>
          </p>

          <!-- Customer Details -->
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <tr><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;color:#888;width:120px;font-size:13px;">Customer</td><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;font-weight:600;">${data.customerName}</td></tr>
            <tr><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;color:#888;font-size:13px;">Phone</td><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;"><a href="tel:${data.customerPhone}" style="color:#2d5a27;font-weight:600;">${data.customerPhone}</a></td></tr>
            ${data.customerEmail ? `<tr><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;color:#888;font-size:13px;">Email</td><td style="padding:10px 12px;border-bottom:1px solid #f0e8da;">${data.customerEmail}</td></tr>` : ''}
            ${addressBlock}
            ${data.notes ? `<tr><td style="padding:10px 12px;color:#888;font-size:13px;">Notes</td><td style="padding:10px 12px;font-style:italic;">${data.notes}</td></tr>` : ''}
          </table>

          <!-- Items -->
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <thead><tr style="background:#2d5a27;color:#fff;"><th style="padding:10px 12px;text-align:left;">Item</th><th style="padding:10px 12px;text-align:right;">Amount</th></tr></thead>
            <tbody>${itemsRows}</tbody>
            <tfoot>
              <tr><td style="padding:8px 12px;color:#888;">Subtotal</td><td style="padding:8px 12px;text-align:right;">₹${data.subtotal.toLocaleString('en-IN')}</td></tr>
              ${data.discount > 0 ? `<tr><td style="padding:8px 12px;color:#4caf50;">Discount${data.couponCode ? ` (${data.couponCode})` : ''}</td><td style="padding:8px 12px;text-align:right;color:#4caf50;">−₹${data.discount.toLocaleString('en-IN')}</td></tr>` : ''}
              ${data.orderType === 'delivery' && data.deliveryFee > 0 ? `<tr><td style="padding:8px 12px;color:#888;">Delivery Fee</td><td style="padding:8px 12px;text-align:right;color:#888;">₹${data.deliveryFee} (at delivery)</td></tr>` : ''}
              <tr style="background:#f0e8da;"><td style="padding:12px;font-weight:700;font-size:15px;">Total Paid</td><td style="padding:12px;text-align:right;font-weight:700;font-size:15px;color:#2d5a27;">₹${data.total.toLocaleString('en-IN')}</td></tr>
            </tfoot>
          </table>

          <a href="https://ksnaahaar.com/admin/orders" style="display:inline-block;background:#2d5a27;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-bottom:16px;">View in Admin Panel →</a>
          <p style="font-size:12px;color:#aaa;margin-top:16px;">KSN AAHAAR — Miyapur, Hyderabad</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send admin order alert:', err);
    return false;
  }
}
