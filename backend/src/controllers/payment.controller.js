const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Simulate PayPal and QR code payment initialization
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user.id;

    let order = await Order.findById(orderId);
    if (!order) {
      order = await Order.create({
        user: userId,
        items: [{ name: 'Test Meal', quantity: 1, price: 10 }],
        totalAmount: 10,
        status: 'Pending',
        paymentStatus: 'Pending'
      });
    }

    const payment = await Payment.create({
      user: userId,
      order: order._id,
      amount: order.totalAmount,
      method: method || 'PayPal',
      status: 'Pending',
    });

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
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, success } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.status = success ? 'Completed' : 'Failed';
    payment.transactionId = `txn_${Date.now()}`;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: success ? 'Paid' : 'Failed'
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
