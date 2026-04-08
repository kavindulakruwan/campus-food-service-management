const QRCode = require('qrcode')
const Order = require('../models/Order')
const MenuItem = require('../models/MenuItem')

// POST /api/orders  — place a new order
exports.placeOrder = async (req, res) => {
  const { items, pickupTime, note } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must have at least one item' })
  }

  // Validate each item and fetch current price from DB
  const menuIds = items.map((i) => i.menuItemId)
  const menuDocs = await MenuItem.find({ _id: { $in: menuIds }, available: true })

  if (menuDocs.length !== menuIds.length) {
    return res.status(400).json({ success: false, message: 'One or more items are unavailable' })
  }

  const menuMap = Object.fromEntries(menuDocs.map((m) => [m._id.toString(), m]))

  const orderItems = items.map((i) => {
    const doc = menuMap[i.menuItemId]
    return { menuItem: doc._id, name: doc.name, price: doc.price, quantity: i.quantity }
  })

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const order = await Order.create({
    student: req.user.id,
    items: orderItems,
    total,
    pickupTime: pickupTime ? new Date(pickupTime) : undefined,
    note: note || '',
  })

  // Generate QR code with order summary
  const qrPayload = JSON.stringify({ orderId: order._id.toString(), student: req.user.name, total })
  const qrCode = await QRCode.toDataURL(qrPayload)

  order.qrCode = qrCode
  await order.save()

  return res.status(201).json({ success: true, data: order })
}

// GET /api/orders  — list student's own orders
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ student: req.user.id }).sort({ createdAt: -1 })
  return res.json({ success: true, data: orders })
}

// GET /api/orders/:id  — single order detail
exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, student: req.user.id })
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
  return res.json({ success: true, data: order })
}

// PATCH /api/orders/:id/cancel  — cancel pending order
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, student: req.user.id })
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
  if (order.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' })
  }
  order.status = 'cancelled'
  await order.save()
  return res.json({ success: true, data: order })
}
