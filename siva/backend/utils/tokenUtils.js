import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkeythatisverylongandsecure2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

export const generateAndSetRefreshToken = async (res, user) => {
  const refreshTokenString = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeythatislongandsecure2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Expiry date is 7 days from now
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  // Delete previous refresh tokens for this user to maintain active sessions limit
  await RefreshToken.deleteMany({ user: user._id });

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenString,
    expiryDate,
  });

  // Set HTTP-only cookie
  res.cookie('refreshToken', refreshTokenString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return refreshTokenString;
};
