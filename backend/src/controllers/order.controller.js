const Order = require('../models/Order');

// User handlers
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    const orderItems = Array.isArray(items) && items.length > 0
      ? items
          .map((item) => ({
            name: String(item.name || 'Custom Meal'),
            quantity: Math.max(1, Number(item.quantity) || 1),
            price: Math.max(0, Number(item.price) || 0),
          }))
          .filter((item) => item.name && item.quantity > 0)
      : [];

    const defaultItems = [
      { name: 'Spicy Chicken Sandwich', quantity: 1, price: 8.50 },
      { name: 'Curly Fries', quantity: 1, price: 3.50 }
    ];

    const finalItems = orderItems.length > 0 ? orderItems : defaultItems;
    const totalAmount = finalItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const order = await Order.create({
      user: req.user.id,
      orderNumber: 'ORD-' + Date.now() + 'NEW',
      items: finalItems,
      totalAmount,
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
