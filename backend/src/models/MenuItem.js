const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverage'], default: 'lunch' },
  available:   { type: Boolean, default: true },
  imageUrl:    { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('MenuItem', menuItemSchema)
