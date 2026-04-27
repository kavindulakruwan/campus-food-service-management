const mongoose = require('mongoose')

const mealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  mealTime: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
  },
  mealName: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    maxlength: [120, 'Meal name too long'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Minimum quantity is 1'],
    max: [50, 'Maximum quantity is 50'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes too long'],
    default: '',
  },
}, { timestamps: true })

mealPlanSchema.index({ user: 1, date: 1, mealTime: 1 }, { unique: true })

module.exports = mongoose.model('MealPlan', mealPlanSchema)
