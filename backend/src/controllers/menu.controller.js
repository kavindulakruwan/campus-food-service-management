const MenuItem = require('../models/MenuItem')

// GET /api/menu  — public menu list
exports.getMenu = async (_req, res) => {
  const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 })
  return res.json({ success: true, data: items })
}

// POST /api/menu  — admin: add item
exports.createMenuItem = async (req, res) => {
  const item = await MenuItem.create(req.body)
  return res.status(201).json({ success: true, data: item })
}

// PATCH /api/menu/:id  — admin: update item
exports.updateMenuItem = async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
  return res.json({ success: true, data: item })
}

// DELETE /api/menu/:id  — admin: remove item
exports.deleteMenuItem = async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id)
  return res.json({ success: true, message: 'Item removed' })
}
