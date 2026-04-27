<<<<<<< HEAD
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Simulate PayPal and QR code payment initialization
=======
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const buildInitiationPayload = (payment) => {
  if (payment.method === 'PayPal') {
    return {
      success: true,
      paymentId: payment._id,
      amount: payment.amount,
      approvalUrl: `http://localhost:5173/checkout?token=mock_txn_${payment._id}`,
    };
  }

  return {
    success: true,
    paymentId: payment._id,
    amount: payment.amount,
    qrData: `campusfood:pay:${payment._id}:amt:${payment.amount}`,
  };
};

// Simulate PayPal payment initialization
>>>>>>> e9d2b905e0f7ace13fb2490b76b92ea117b4ea26
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user.id;

<<<<<<< HEAD
    let order = await Order.findById(orderId);
    if (!order) {
      order = await Order.create({
        user: userId,
        items: [{ name: 'Test Meal', quantity: 1, price: 10 }],
        totalAmount: 10,
        status: 'Pending',
        paymentStatus: 'Pending'
      });
=======
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
>>>>>>> e9d2b905e0f7ace13fb2490b76b92ea117b4ea26
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid orderId' });
    }

    if (!['PayPal', 'QRCode'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // We'd normally fetch the order to get the amount
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let payment = await Payment.findOne({
      user: userId,
      order: order._id,
      status: 'Pending',
    }).sort({ createdAt: -1 });

    if (payment) {
      if (payment.method !== method) {
        payment.method = method;
      }

      if (payment.amount !== order.totalAmount) {
        payment.amount = order.totalAmount;
      }

      await payment.save();
      return res.status(200).json(buildInitiationPayload(payment));
    }

    payment = await Payment.create({
      user: userId,
      order: order._id,
      amount: order.totalAmount,
      method,
      status: 'Pending',
    });

<<<<<<< HEAD
    if (method === 'PayPal') {
      const mockApprovalLink = `http://localhost:5173/checkout?token=mock_txn_${payment._id}`;
      return res.status(200).json({
        success: true,
        paymentId: payment._id,
        amount: payment.amount,
        approvalUrl: mockApprovalLink
      });
    } else if (method === 'QRCode') {
      const qrData = `campusfood:pay:${payment._id}:amt:${order.totalAmount}`;
      const qrImage = await QRCode.toDataURL(qrData);
      return res.status(200).json({
        success: true,
        paymentId: payment._id,
        qrData,
        qrImage
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid method' });
    }
=======
    return res.status(200).json(buildInitiationPayload(payment));
>>>>>>> e9d2b905e0f7ace13fb2490b76b92ea117b4ea26
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, success } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid paymentId' });
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.status = success ? 'Completed' : 'Failed';
    payment.transactionId = `txn_${Date.now()}`;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: success ? 'Paid' : 'Failed',
      status: success ? 'Completed' : 'Pending',
    });

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('order', 'totalAmount items createdAt')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPaymentReceipt = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment id' });
    }

    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order', 'items totalAmount');
      
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin handlers
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment id' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Can only refund completed payments' });
    }

    payment.status = 'Refunded';
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Refunded' });

    res.status(200).json({ success: true, data: payment, message: 'Refund successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
