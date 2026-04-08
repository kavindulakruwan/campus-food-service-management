import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  fetchMenu,
  placeOrder,
  fetchMyOrders,
  cancelOrder,
  type MenuItemData,
  type OrderData,
} from '../../api/order.api'

// ─── Cart ────────────────────────────────────────────────────────────────────
interface CartItem extends MenuItemData { quantity: number }

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍿 Snack',
  beverage: '☕ Beverage',
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ready:     'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-500',
}

// ─── Component ───────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const [tab, setTab] = useState<'menu' | 'history'>('menu')
  const [menu, setMenu] = useState<MenuItemData[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<OrderData[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [note, setNote] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchMenu().then((r) => setMenu(r.data.data)).catch(() => {})
    loadOrders()
  }, [])

  const loadOrders = () =>
    fetchMyOrders().then((r) => setOrders(r.data.data)).catch(() => {})

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id)
      if (existing) return prev.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((c) => c._id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id)
    setCart((prev) => prev.map((c) => c._id === id ? { ...c, quantity: qty } : c))
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await placeOrder({
        items: cart.map((c) => ({ menuItemId: c._id, quantity: c.quantity })),
        note: note || undefined,
        pickupTime: pickupTime || undefined,
      })
      setSelectedOrder(res.data.data)
      setCart([])
      setNote('')
      setPickupTime('')
      setSuccess('Order placed successfully!')
      loadOrders()
      setTab('history')
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Cancel order ──────────────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    try {
      await cancelOrder(id)
      loadOrders()
      if (selectedOrder?._id === id) setSelectedOrder(null)
    } catch {
      setError('Failed to cancel order.')
    }
  }

  // ── Group menu by category ────────────────────────────────────────────────
  const grouped = menu.reduce<Record<string, MenuItemData[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ? [...acc[item.category], item] : [item]
    return acc
  }, {})

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Browse the menu, add to cart, and place your order</p>
        </div>
        <div className="flex gap-2">
          {(['menu', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'menu' ? '🍽️ Menu' : '📋 My Orders'}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>}

      {/* ── Menu + Cart ── */}
      {tab === 'menu' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Menu */}
          <div className="space-y-6">
            {Object.keys(grouped).length === 0 && (
              <p className="text-slate-500 text-sm">No menu items available. Ask an admin to seed the menu.</p>
            )}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-600">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                        <p className="mt-1 text-sm font-semibold text-orange-600">Rs. {item.price}</p>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="ml-3 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 transition"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit sticky top-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">🛒 Cart</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-400">Your cart is empty</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {cart.map((c) => (
                    <li key={c._id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 flex-1">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c._id, c.quantity - 1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">−</button>
                        <span className="w-5 text-center">{c.quantity}</span>
                        <button onClick={() => updateQty(c._id, c.quantity + 1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                        <button onClick={() => removeFromCart(c._id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 pt-3 mb-4">
                  <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Total</span>
                    <span>Rs. {cartTotal}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Pickup Time (optional)</label>
                    <input
                      type="datetime-local"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Note (optional)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. No spicy please"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-orange-400 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {loading ? 'Placing...' : 'Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Order History ── */}
      {tab === 'history' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="text-sm text-slate-500">No orders yet. Go to the menu tab to place one.</p>
            )}
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`cursor-pointer rounded-xl border p-4 transition hover:shadow-md ${
                  selectedOrder?._id === order._id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-mono">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-600">Rs. {order.total}</span>
                  <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Detail + QR */}
          {selectedOrder && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Order Detail</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.name} ×{i.quantity}</span>
                    <span>Rs. {i.price * i.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold text-slate-800">
                  <span>Total</span>
                  <span>Rs. {selectedOrder.total}</span>
                </div>
              </div>

              {selectedOrder.note && (
                <p className="text-xs text-slate-500 italic">Note: {selectedOrder.note}</p>
              )}

              {selectedOrder.pickupTime && (
                <p className="text-xs text-slate-500">Pickup: {new Date(selectedOrder.pickupTime).toLocaleString()}</p>
              )}

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Pickup QR Code</p>
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <QRCodeSVG
                    value={JSON.stringify({
                      orderId: selectedOrder._id,
                      total: selectedOrder.total,
                      status: selectedOrder.status,
                    })}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                    level="M"
                  />
                </div>
                <p className="text-xs text-slate-400">Show this at the counter to collect your order</p>
              </div>

              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleCancel(selectedOrder._id)}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default OrdersPage
