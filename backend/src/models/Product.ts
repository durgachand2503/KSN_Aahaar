import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
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
  price: { type: Number, required: true, min: 0 },
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
    image: { type: String, required: true },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
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
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Indexes
productSchema.index({ categorySlug: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ displayOrder: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IProduct>('Product', productSchema);
