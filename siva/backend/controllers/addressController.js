import Address from '../models/Address.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id });

  res.status(200).json({
    status: 'success',
    addresses,
  });
});

export const createAddress = catchAsync(async (req, res, next) => {
  const {
    name,
    phone,
    alternatePhone,
    locality,
    addressLine,
    city,
    state,
    landmark,
    pincode,
    addressType,
    isDefault,
  } = req.body;

  if (isDefault) {
    // Set all other addresses isDefault to false
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    user: req.user._id,
    name,
    phone,
    alternatePhone,
    locality,
    addressLine,
    city,
    state,
    landmark,
    pincode,
    addressType,
    isDefault: !!isDefault,
  });

  res.status(201).json({
    status: 'success',
    address,
  });
});

export const updateAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  const {
    name,
    phone,
    alternatePhone,
    locality,
    addressLine,
    city,
    state,
    landmark,
    pincode,
    addressType,
    isDefault,
  } = req.body;

  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
  } else if (isDefault === false) {
    address.isDefault = false;
  }

  address.name = name || address.name;
  address.phone = phone || address.phone;
  address.alternatePhone = alternatePhone !== undefined ? alternatePhone : address.alternatePhone;
  address.locality = locality || address.locality;
  address.addressLine = addressLine || address.addressLine;
  address.city = city || address.city;
  address.state = state || address.state;
  address.landmark = landmark !== undefined ? landmark : address.landmark;
  address.pincode = pincode || address.pincode;
  address.addressType = addressType || address.addressType;

  await address.save();

  res.status(200).json({
    status: 'success',
    address,
  });
});

export const deleteAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  // If we deleted the default address, make another one default if possible
  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Address deleted successfully',
  });
});
