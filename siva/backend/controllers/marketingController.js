import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Banner from '../models/Banner.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Categories
export const getCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({}).populate('parent');
  res.status(200).json({
    status: 'success',
    categories,
  });
});

export const createCategory = catchAsync(async (req, res, next) => {
  const { name, image, parent } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const category = await Category.create({
    name,
    slug,
    image,
    parent: parent || null,
  });

  res.status(201).json({
    status: 'success',
    category,
  });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  await category.deleteOne();
  res.status(200).json({
    status: 'success',
    message: 'Category deleted successfully',
  });
});

// Brands
export const getBrands = catchAsync(async (req, res, next) => {
  const brands = await Brand.find({});
  res.status(200).json({
    status: 'success',
    brands,
  });
});

export const createBrand = catchAsync(async (req, res, next) => {
  const { name, logo, description } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const brand = await Brand.create({
    name,
    slug,
    logo,
    description,
  });

  res.status(201).json({
    status: 'success',
    brand,
  });
});

export const deleteBrand = catchAsync(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return next(new AppError('Brand not found', 404));
  }
  await brand.deleteOne();
  res.status(200).json({
    status: 'success',
    message: 'Brand deleted successfully',
  });
});

// Banners
export const getBanners = catchAsync(async (req, res, next) => {
  const banners = await Banner.find({ isActive: true }).sort('position');
  res.status(200).json({
    status: 'success',
    banners,
  });
});

export const getAllBannersAdmin = catchAsync(async (req, res, next) => {
  const banners = await Banner.find({}).sort('position');
  res.status(200).json({
    status: 'success',
    banners,
  });
});

export const createBanner = catchAsync(async (req, res, next) => {
  const { title, subtitle, imageUrl, linkUrl, position, isActive } = req.body;

  const banner = await Banner.create({
    title,
    subtitle,
    imageUrl,
    linkUrl,
    position: position ? Number(position) : 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    status: 'success',
    banner,
  });
});

export const deleteBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }
  await banner.deleteOne();
  res.status(200).json({
    status: 'success',
    message: 'Banner deleted successfully',
  });
});
