const Order = require('../models/Order');

// User handlers
exports.createOrder = async (req, res) => {
  try {
    // Generate a fun mock order
    const order = await Order.create({
      user: req.user.id,
      orderNumber: 'ORD-' + Date.now() + 'NEW',
      items: [
        { name: 'Spicy Chicken Sandwich', quantity: 1, price: 8.50 },
        { name: 'Curly Fries', quantity: 1, price: 3.50 }
      ],
      totalAmount: 12.00,
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
