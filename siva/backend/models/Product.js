import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, default: '' }
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required'],
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    variants: [variantSchema],
    tax: {
      type: Number,
      default: 0, // percentage
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    returnPolicy: {
      type: String,
      default: '7 days replacement policy',
    },
    warranty: {
      type: String,
      default: 'No warranty',
    },
    ratings: {
      type: Number,
      default: 0,
      index: true,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Search Index
productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
