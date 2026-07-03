import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    contactEmail: {
      type: String,
      default: 'support@flipkartclone.com',
    },
    contactPhone: {
      type: String,
      default: '+1800100200',
    },
    platformFeePercent: {
      type: Number,
      default: 5.0, // 5% fee for sellers
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    supportedGateways: {
      type: [String],
      default: ['COD', 'Stripe', 'Razorpay', 'Wallet', 'UPI'],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
