import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: mongoose.Types.ObjectId;
  categoryName: string;
  categorySlug: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewItem: boolean;      // 'New' badge on menu
  isActive: boolean;      // false = archived (soft-delete)
  variants: IProductVariant[];
  ingredients: string[];
  servingInfo: string;
  displayOrder: number;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 1 },

  isAvailable: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    categorySlug: { type: String, required: true },
    image: { type: String, default: '' },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewItem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    variants: {
      type: [productVariantSchema],
      validate: [(val: IProductVariant[]) => val.length > 0, 'At least one variant is required'],
    },
    ingredients: [{ type: String }],
    servingInfo: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id; // keep _id as well for backward-compat
        delete ret.__v;
      },
    },
  }
);

// Indexes
productSchema.index({ categorySlug: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNewItem: 1 });
productSchema.index({ displayOrder: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IProduct>('Product', productSchema);
