const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['PayPal', 'QRCode', 'CreditCard'], // Extend as needed
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  transactionId: {
    type: String,
    // Optional initially, filled when completed by provider
  },
  receiptUrl: {
    type: String,
  },
  receiptSent: {
    type: Boolean,
    default: false,
  },
  refundRequest: {
    requested: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['None', 'Pending', 'Approved', 'Rejected'],
      default: 'None',
    },
    requestedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
