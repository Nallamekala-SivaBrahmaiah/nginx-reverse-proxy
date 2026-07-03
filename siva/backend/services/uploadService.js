import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
  !process.env.CLOUDINARY_API_KEY.includes('your_');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  logger.warn('Cloudinary not configured. Falling back to Mock Image Upload simulator.');
}

export const uploadToCloudinary = async (fileBuffer, folder = 'products') => {
  if (!isCloudinaryConfigured) {
    // Generate a simulated mock URL
    const mockId = `mock_${Math.random().toString(36).substr(2, 9)}`;
    return {
      public_id: `${folder}/${mockId}`,
      url: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (public_id) => {
  if (!isCloudinaryConfigured) {
    logger.info(`Simulated deletion of image with id: ${public_id}`);
    return { result: 'ok' };
  }
  return await cloudinary.uploader.destroy(public_id);
};
