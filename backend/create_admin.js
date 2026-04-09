const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@campus.edu' });
    
    if (!admin) {
      console.log('Creating new admin account...');
      admin = await User.create({
        name: 'Campus Admin',
        email: 'admin@campus.edu',
        password: 'password123', // Model will hash this before saving
        role: 'admin'
      });
      console.log('Admin account perfectly created!');
    } else {
      console.log('Admin account already exists!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
});
