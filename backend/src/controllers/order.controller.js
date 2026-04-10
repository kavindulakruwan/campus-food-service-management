const Order = require('../models/Order');
const QRCode = require('qrcode');

// CREATE order
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, specialInstructions, paymentMethod } = req.body;

    const orderItems = Array.isArray(items) && items.length > 0
      ? items.map((item) => ({
          name: String(item.name || 'Custom Meal'),
          quantity: Math.max(1, Number(item.quantity) || 1),
          price: Math.max(0, Number(item.price) || 0),
        })).filter((item) => item.name && item.quantity > 0)
      : [];

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const orderNumber = 'ORD-' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    // Generate QR code
    const qrData = JSON.stringify({ orderNumber, totalAmount, userId: req.user.id, timestamp: new Date().toISOString() });
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const order = await Order.create({
      user: req.user.id,
      orderNumber,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || '',
      specialInstructions: specialInstructions || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'Pending',
      paymentStatus: 'Pending',
      qrCode: qrCodeImage,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// READ - get user orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// READ - get single order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// READ - get QR code
exports.getOrderQRCode = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = isObjectId
      ? await Order.findById(req.params.id)
      : await Order.findOne({ orderNumber: req.params.id });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Generate if not exists
    if (!order.qrCode) {
      const QRCode = require('qrcode');
      const qrData = JSON.stringify({ orderNumber: order.orderNumber, totalAmount: order.totalAmount, timestamp: order.createdAt });
      order.qrCode = await QRCode.toDataURL(qrData);
      await order.save();
    }

    res.json({ success: true, data: { qrCode: order.qrCode, orderNumber: order.orderNumber } });
  } catch (error) {
    console.error('QR error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// UPDATE - cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order in current status' });
    }
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// UPDATE - update status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// READ all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
