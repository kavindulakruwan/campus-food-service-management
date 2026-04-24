const Order = require('../models/Order');
const MealItem = require('../models/MealItem');

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
    const sampleItems = [
      { name: 'Campus Burger', quantity: 1, price: 850 },
      { name: 'Fresh Juice', quantity: 1, price: 350 },
    ];

    const requestedItems = Array.isArray(req.body?.items)
      ? req.body.items
          .map((item) => ({
            mealId: item?.mealId ? String(item.mealId) : undefined,
            name: String(item?.name || '').trim(),
            quantity: Number(item?.quantity || 0),
            price: Number(item?.price || 0),
          }))
          .filter((item) => item.name && item.quantity > 0 && item.price >= 0)
      : [];

    let items = requestedItems.length > 0 ? requestedItems : sampleItems;

    const itemsWithMealId = requestedItems.filter((item) => item.mealId);
    if (itemsWithMealId.length > 0) {
      for (const item of itemsWithMealId) {
        const meal = await MealItem.findById(item.mealId);

        if (!meal) {
          return res.status(404).json({ success: false, message: `Meal not found for ${item.name}` });
        }

        const currentQuantity = Number.isFinite(meal.quantity)
          ? meal.quantity
          : (meal.isAvailable ? 1 : 0);

        if (currentQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${currentQuantity} portion(s) left for ${meal.name}`,
          });
        }

        meal.quantity = currentQuantity - item.quantity;
        meal.isAvailable = meal.quantity > 0;
        await meal.save();

        item.name = meal.name;
        item.price = meal.price;
      }

      items = requestedItems.map(({ mealId, ...rest }) => rest);
    }

    const totalAmount = Number(req.body?.totalAmount);
    const finalTotal = Number.isFinite(totalAmount) && totalAmount > 0
      ? totalAmount
      : calculateTotal(items);
    const paymentMethod = ['Cash', 'PayPal', 'QRCode'].includes(req.body.paymentMethod)
      ? req.body.paymentMethod
      : 'Cash';

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount: finalTotal,
      status: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod,
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
