const Order = require('../models/Order');

const fallbackItems = [
  { name: 'Spicy Chicken Sandwich', quantity: 1, price: 8.5 },
  { name: 'Curly Fries', quantity: 1, price: 3.5 }
];

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return fallbackItems;
  }

  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      quantity: Number(item?.quantity || 0),
      price: Number(item?.price || 0),
    }))
    .filter((item) => item.name && item.quantity > 0 && item.price >= 0);
};

const calculateTotal = (items) => items.reduce((sum, item) => sum + item.quantity * item.price, 0);

// User handlers
exports.createOrder = async (req, res) => {
  try {
    const items = normalizeItems(req.body.items);
    const totalAmount = Number(req.body.totalAmount);
    const finalTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : calculateTotal(items);

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount: finalTotal,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin handlers
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email whitespace')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
