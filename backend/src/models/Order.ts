import mongoose, { Document, Schema } from 'mongoose';

// ── Status constants ──
export const ORDER_STATUSES = [
  'placed', 'payment_pending', 'payment_confirmed', 'payment_failed',
  'accepted', 'preparing', 'ready', 'out_for_delivery',
  'delivered', 'cancelled', 'refund_pending', 'refunded',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ['pending', 'captured', 'failed', 'refund_pending', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const ORDER_TYPES = ['delivery', 'pickup'] as const;
export type OrderType = typeof ORDER_TYPES[number];

// ── Valid status transitions ──
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['payment_pending', 'cancelled'],
  payment_pending: ['payment_confirmed', 'payment_failed', 'cancelled'],
  payment_confirmed: ['accepted', 'cancelled'],
  payment_failed: ['payment_pending', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
};

export interface IOrderItem {
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image: string;
  isVeg: boolean;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IDeliveryAddress {
  houseFlat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
}

export interface IOrder extends Document {
  orderId: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: IOrderItem[];
  orderType: OrderType;
  deliveryAddress?: IDeliveryAddress;
  scheduledTime?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  variantName: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  isVeg: { type: Boolean, required: true },
}, { _id: false });

const statusHistorySchema = new Schema<IStatusHistoryEntry>({
  status: { type: String, enum: ORDER_STATUSES, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
}, { _id: false });

const deliveryAddressSchema = new Schema<IDeliveryAddress>({
  houseFlat: { type: String, required: true },
  street: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: 'Telangana' },
  pincode: { type: String, required: true },
  instructions: { type: String },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    items: {
      type: [orderItemSchema],
      validate: [(val: IOrderItem[]) => val.length > 0, 'At least one item is required'],
    },
    orderType: { type: String, enum: ORDER_TYPES, required: true },
    deliveryAddress: deliveryAddressSchema,
    scheduledTime: { type: Date },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String },
    notes: { type: String },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

// Auto-generate orderId
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `KSN${(count + 1001).toString()}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
