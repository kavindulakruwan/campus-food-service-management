const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./src/models/Payment');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    console.log('Clearing old transaction logs...');
    await Payment.deleteMany({});
    await Order.deleteMany({});
    
    const user = await User.findOne();
    if (!user) {
      console.log('No user exists yet to attach an order to! Just cleared history.');
      process.exit(0);
    }

    // 1. A Completed Order with Payment
    console.log('Creating a mock COMPLETED transaction...');
    const completedOrder = await Order.create({
      user: user._id,
      orderNumber: 'ORD-' + Date.now() + 'CMP',
      items: [{ name: 'Dining Hall Pizza Combo', quantity: 1, price: 10.00 }],
      totalAmount: 10.00,
      status: 'Completed',
      paymentStatus: 'Paid'
    });

    await Payment.create({
      user: user._id,
      order: completedOrder._id,
      amount: 10.00,
      method: 'PayPal',
      status: 'Completed',
      transactionId: 'txn_' + Date.now() + '_mock',
      receiptSent: true
    });

    // 2. A Pending Order without Payment
    console.log('Creating a mock PENDING order for testing checkout...');
    await Order.create({
      user: user._id,
      orderNumber: 'ORD-' + Date.now() + 'PND',
      items: [
        { name: 'Library Coffee', quantity: 1, price: 3.50 },
        { name: 'Blueberry Muffin', quantity: 1, price: 2.50 }
      ],
      totalAmount: 6.00,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    console.log('Success! Cleaned DB and added 1 Completed and 1 Pending order.');
    process.exit(0);
  } catch (err) {
    console.error('Error during reset:', err);
    process.exit(1);
  }
});
