const mongoose = require('mongoose')

const mealOfferSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['none', 'discount', 'combo'],
    default: 'none',
  },
  title: {
    type: String,
    trim: true,
    maxlength: [80, 'Offer title too long'],
    default: '',
  },
  discountPercent: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100'],
    default: 0,
  },
  comboText: {
    type: String,
    trim: true,
    maxlength: [120, 'Combo offer text too long'],
    default: '',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
}, { _id: false })

const mealReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be greater than 5'],
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [300, 'Review comment too long'],
  },
}, { timestamps: true })

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
  reviews: {
    type: [mealReviewSchema],
    default: [],
  },
  offer: {
    type: mealOfferSchema,
    default: () => ({}),
  },
}, { timestamps: true })

// Indexes for common listing filters and newest-first sorting.
mealItemSchema.index({ createdAt: -1 })
mealItemSchema.index({ category: 1, isAvailable: 1, createdAt: -1 })
mealItemSchema.index({ price: 1, createdAt: -1 })

module.exports = mongoose.model('MealItem', mealItemSchema)