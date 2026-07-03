import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      enum: ['COD', 'Stripe', 'Razorpay', 'Wallet', 'UPI'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Succeeded', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    refundDetails: {
      refundId: String,
      amountRefunded: Number,
      reason: String,
      refundedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
