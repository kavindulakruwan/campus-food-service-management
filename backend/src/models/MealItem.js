const mongoose = require('mongoose')

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    maxlength: [120, 'Meal name too long'],
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverage'],
    default: 'lunch',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1,
  },
  calories: {
    type: Number,
    default: 0,
    min: [0, 'Calories cannot be negative'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description too long'],
    default: '',
  },
  imageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('MealItem', mealItemSchema)