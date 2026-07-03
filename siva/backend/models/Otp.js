import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset', 'login'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Expires and gets deleted in 5 minutes (300 seconds)
    },
  }
);

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
