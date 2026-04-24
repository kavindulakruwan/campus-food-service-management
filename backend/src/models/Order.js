const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    sparse: true,
    default: () => 'ORD-' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'PayPal', 'QRCode'],
    default: 'Cash'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
