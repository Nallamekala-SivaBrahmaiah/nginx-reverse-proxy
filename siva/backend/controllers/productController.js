import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/uploadService.js';

// Get all products with filters, sorting, and pagination
export const getAllProducts = catchAsync(async (req, res, next) => {
  const {
    keyword,
    category,
    brand,
    priceMin,
    priceMax,
    ratingMin,
    discountMin,
    sort,
    page = 1,
    limit = 12,
    seller,
  } = req.query;

  const query = {};

  if (seller) {
    query.seller = seller;
  }

  // Text search
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // Category filter
  if (category) {
    const catIds = category.split(',');
    query.category = { $in: catIds };
  }

  // Brand filter
  if (brand) {
    const brandIds = brand.split(',');
    query.brand = { $in: brandIds };
  }

  // Price range filter
  if (priceMin || priceMax) {
    query.variants = {
      $elemMatch: {
        offerPrice: {
          ...(priceMin && { $gte: Number(priceMin) }),
          ...(priceMax && { $lte: Number(priceMax) }),
        },
      },
    };
  }

  // Rating filter
  if (ratingMin) {
    query.ratings = { $gte: Number(ratingMin) };
  }

  let products = await Product.find(query)
    .populate('category')
    .populate('brand')
    .populate('seller', 'name email');

  // Discount Filter
  if (discountMin) {
    products = products.filter((product) => {
      return product.variants.some((v) => {
        const disc = ((v.price - v.offerPrice) / v.price) * 100;
        return disc >= Number(discountMin);
      });
    });
  }

  // Sorting
  if (sort) {
    if (sort === 'priceAsc') {
      products.sort((a, b) => {
        const aMin = Math.min(...a.variants.map((v) => v.offerPrice));
        const bMin = Math.min(...b.variants.map((v) => v.offerPrice));
        return aMin - bMin;
      });
    } else if (sort === 'priceDesc') {
      products.sort((a, b) => {
        const aMin = Math.min(...a.variants.map((v) => v.offerPrice));
        const bMin = Math.min(...b.variants.map((v) => v.offerPrice));
        return bMin - aMin;
      });
    } else if (sort === 'ratings') {
      products.sort((a, b) => b.ratings - a.ratings);
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  // Pagination
  const totalProducts = products.length;
  const startIndex = (Number(page) - 1) * Number(limit);
  const paginatedProducts = products.slice(startIndex, startIndex + Number(limit));

  res.status(200).json({
    status: 'success',
    totalProducts,
    page: Number(page),
    totalPages: Math.ceil(totalProducts / limit),
    products: paginatedProducts,
  });
});

// Get single product details
export const getProductDetails = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category')
    .populate('brand')
    .populate('seller', 'name email');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    product,
  });
});

// Create product (Seller / Admin)
export const createProduct = catchAsync(async (req, res, next) => {
  const { title, description, category, brand, variants, tax, shippingCharges, returnPolicy, warranty } = req.body;

  // Upload images
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'products');
      images.push(result);
    }
  } else {
    images.push({
      public_id: 'products/placeholder',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
    });
  }

  let parsedVariants = [];
  if (typeof variants === 'string') {
    parsedVariants = JSON.parse(variants);
  } else {
    parsedVariants = variants;
  }

  const product = await Product.create({
    title,
    description,
    category,
    brand,
    seller: req.user._id,
    variants: parsedVariants,
    images,
    tax: tax ? Number(tax) : 0,
    shippingCharges: shippingCharges ? Number(shippingCharges) : 0,
    returnPolicy,
    warranty,
  });

  res.status(201).json({
    status: 'success',
    product,
  });
});

// Update product
export const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Verify ownership
  if (req.user.role === 'seller' && product.seller.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this product', 403));
  }

  const { title, description, category, brand, variants, tax, shippingCharges, returnPolicy, warranty, removeImages } = req.body;

  // Handle image removals
  let currentImages = [...product.images];
  if (removeImages) {
    const imagesToDelete = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
    for (const publicId of imagesToDelete) {
      await deleteFromCloudinary(publicId);
      currentImages = currentImages.filter((img) => img.public_id !== publicId);
    }
  }

  // Upload new images
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'products');
      currentImages.push(result);
    }
  }

  product.title = title || product.title;
  product.description = description || product.description;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.tax = tax !== undefined ? Number(tax) : product.tax;
  product.shippingCharges = shippingCharges !== undefined ? Number(shippingCharges) : product.shippingCharges;
  product.returnPolicy = returnPolicy || product.returnPolicy;
  product.warranty = warranty || product.warranty;
  product.images = currentImages;

  if (variants) {
    product.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
  }

  await product.save();

  res.status(200).json({
    status: 'success',
    product,
  });
});

// Delete product
export const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  if (req.user.role === 'seller' && product.seller.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to delete this product', 403));
  }

  for (const img of product.images) {
    await deleteFromCloudinary(img.public_id);
  }

  await product.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

// Get similar products
export const getSimilarProducts = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const similar = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .limit(6)
    .populate('category')
    .populate('brand');

  res.status(200).json({
    status: 'success',
    products: similar,
  });
});
