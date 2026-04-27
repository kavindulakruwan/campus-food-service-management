const mongoose = require('mongoose')

const pantryItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [120, 'Item name too long'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.1, 'Quantity must be greater than 0'],
  },
  unit: {
    type: String,
    enum: ['g', 'ml', 'cup', 'tbsp', 'tsp', 'count', 'oz'],
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['Grains', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Condiments', 'Spices', 'Other'],
    default: 'Other',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long'],
    default: '',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
    index: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true })

pantryItemSchema.index({ user: 1, createdAt: -1 })
pantryItemSchema.index({ approvalStatus: 1, createdAt: -1 })

module.exports = mongoose.model('PantryItem', pantryItemSchema)
