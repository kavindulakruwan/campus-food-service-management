const Order = require('../models/Order');
const QRCode = require('qrcode');

const ORDER_CONFIRMABLE_STATES = ['Pending'];

const buildOrderItems = (items) => (
  Array.isArray(items) && items.length > 0
    ? items
      .map((item) => ({
        name: String(item.name || 'Custom Meal'),
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.price) || 0),
      }))
      .filter((item) => item.name && item.quantity > 0)
    : []
);

exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, specialInstructions, paymentMethod } = req.body;
    const orderItems = buildOrderItems(items);
    if (orderItems.length === 0) return res.status(400).json({ success: false, message: 'At least one item is required' });
    const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const orderNumber = 'ORD-' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const qrData = JSON.stringify({ orderNumber, totalAmount, userId: req.user.id, timestamp: new Date().toISOString() });
    const qrCodeImage = await QRCode.toDataURL(qrData);
    const order = await Order.create({ user: req.user.id, orderNumber, items: orderItems, totalAmount, deliveryAddress: deliveryAddress || '', specialInstructions: specialInstructions || '', paymentMethod: paymentMethod || 'Cash', status: 'Pending', paymentStatus: 'Pending', qrCode: qrCodeImage });
    res.status(201).json({ success: true, data: order });
  } catch (error) { console.error('Error creating order:', error); res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!ORDER_CONFIRMABLE_STATES.includes(order.status) || order.paymentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be edited' });
    }

    const { items, deliveryAddress, specialInstructions, paymentMethod } = req.body;

    if (items !== undefined) {
      const orderItems = buildOrderItems(items);
      if (orderItems.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one item is required' });
      }
      order.items = orderItems;
      order.totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const qrData = JSON.stringify({ orderNumber: order.orderNumber, totalAmount: order.totalAmount, userId: req.user.id, timestamp: new Date().toISOString() });
      order.qrCode = await QRCode.toDataURL(qrData);
    }

    if (deliveryAddress !== undefined) order.deliveryAddress = deliveryAddress || '';
    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions || '';
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod || 'Cash';

    await order.save();

    res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.getOrderById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = isObjectId ? await Order.findById(req.params.id) : await Order.findOne({ orderNumber: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: order });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.getOrderQRCode = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = isObjectId ? await Order.findById(req.params.id) : await Order.findOne({ orderNumber: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!order.qrCode) {
      const qrData = JSON.stringify({ orderNumber: order.orderNumber, totalAmount: order.totalAmount, timestamp: order.createdAt });
      order.qrCode = await QRCode.toDataURL(qrData);
      await order.save();
    }
    res.json({ success: true, data: { qrCode: order.qrCode, orderNumber: order.orderNumber } });
  } catch (error) { console.error('QR error:', error); res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!ORDER_CONFIRMABLE_STATES.includes(order.status)) return res.status(400).json({ success: false, message: 'Cannot cancel order after confirmation' });
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!ORDER_CONFIRMABLE_STATES.includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be confirmed in its current status' });
    }

    order.status = 'Processing';
    order.paymentStatus = 'Pending';
    await order.save();

    res.json({ success: true, data: order, message: 'Order confirmed successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

