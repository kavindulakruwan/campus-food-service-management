const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:      { type: [orderItemSchema], required: true },
  total:      { type: Number, required: true },
  status:     { type: String, enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'], default: 'pending' },
  qrCode:     { type: String },          // base64 data URL
  pickupTime: { type: Date },
  note:       { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
