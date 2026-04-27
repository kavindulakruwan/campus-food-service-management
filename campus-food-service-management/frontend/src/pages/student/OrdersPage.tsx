import { useEffect, useMemo, useState } from 'react'
import { orderApi } from '../../api/order.api'

const MENU = [
  { id: 'meal-1', name: 'Rice & Curry', description: 'Fresh plate with spicy curry and vegetables.', price: 4.50 },
  { id: 'meal-2', name: 'Chicken Kottu', description: 'Hot shredded roti mixed with veggies and chicken.', price: 5.75 },
  { id: 'meal-3', name: 'Egg Hopper Set', description: 'Crispy hopper with egg, sambol and lentil curry.', price: 3.80 },
  { id: 'meal-4', name: 'Fruit Smoothie', description: 'Seasonal fruit shake to refresh your day.', price: 2.20 },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
}

type CartItem = { id: string; name: string; price: number; quantity: number }
type OrderItem = { name: string; quantity: number; price: number }
type Order = {
  _id: string; orderNumber?: string; status: string; paymentStatus: string
  totalAmount: number; createdAt: string; items: OrderItem[]
  deliveryAddress?: string; specialInstructions?: string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [qrCode, setQrCode] = useState<{ qrCode: string; orderNumber: string } | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'menu' | 'history'>('menu')

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart])
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart])

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders()
      const data = res.data?.data ?? res.data ?? []
      setOrders(Array.isArray(data) ? data : [])
    } catch { setError('Failed to load orders') }
    finally { setLoading(false) }
  }

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQty = (id: string, qty: number) => {
    setCart(prev => qty <= 0 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, quantity: qty } : c))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id))

  // CREATE
  const handleCreateOrder = async () => {
    if (cart.length === 0) { setError('Please add at least one item'); return }
    if (!deliveryAddress.trim()) { setError('Please enter delivery address'); return }
    setCreating(true); setError('')
    try {
      await orderApi.createOrder({
        items: cart.map(({ name, price, quantity }) => ({ name, price, quantity })),
        deliveryAddress, specialInstructions, paymentMethod,
      })
      setSuccess('Order placed successfully!')
      setCart([]); setDeliveryAddress(''); setSpecialInstructions(''); setPaymentMethod('cash')
      setActiveTab('history')
      fetchOrders()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message || 'Failed to place order')
    } finally { setCreating(false) }
  }

  // READ - QR code
  const handleViewQR = async (orderId: string) => {
    try {
      const res = await orderApi.getQRCode(orderId)
      setQrCode(res.data?.data ?? res.data)
    } catch { setError('Failed to load QR code') }
  }

  // DELETE (cancel)
  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return
    setCancelling(orderId)
    try {
      await orderApi.cancelOrder(orderId)
      setSuccess('Order cancelled successfully')
      setViewOrder(null)
      fetchOrders()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message || 'Failed to cancel order')
    } finally { setCancelling(null) }
  }

  const activeOrders = orders.filter(o => o.status !== 'cancelled')
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0)
  const thisMonthSpent = orders
    .filter(o => o.status !== 'cancelled' && new Date(o.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, o) => s + o.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-600">Food Orders</p>
          <h1 className="text-3xl font-bold text-slate-900">Order Booking</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'menu' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Menu {cartCount > 0 && <span className="ml-1 bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs">{cartCount}</span>}
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            My Orders
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">{error}<button onClick={() => setError('')} className="font-bold ml-4">×</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex justify-between">{success}<button onClick={() => setSuccess('')} className="font-bold ml-4">×</button></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Active Orders', value: activeOrders.length },
          { label: 'Total Spent', value: `Rs. ${totalSpent.toFixed(2)}` },
          { label: 'This Month', value: `Rs. ${thisMonthSpent.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Menu Items */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Available Menu</h2></div>
            <div className="p-4 grid gap-3">
              {MENU.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <div key={item.id} className="rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4 hover:border-orange-200 transition">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">Rs. {item.price.toFixed(2)}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-full bg-slate-100 font-bold flex items-center justify-center hover:bg-slate-200">−</button>
                        <span className="w-6 text-center font-semibold">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center hover:bg-slate-700">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition">Add</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cart & Order Form */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-900">Your Cart</h2>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>}
              </div>
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">Add items from the menu</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">Rs. {item.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-slate-100 text-sm flex items-center justify-center">−</button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-slate-900 text-white text-sm flex items-center justify-center">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-50 text-red-500 text-sm flex items-center justify-center ml-1">×</button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
                      <span>Total</span><span>Rs. {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="font-semibold text-slate-900">Order Details</h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Address *</label>
                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Room 204, Block A"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Special Instructions</label>
                <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                  rows={2} placeholder="Any special requests..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="meal_plan">Meal Plan</option>
                </select>
              </div>
              <button onClick={handleCreateOrder} disabled={creating || cart.length === 0}
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition">
                {creating ? 'Placing Order...' : `Place Order · Rs. ${cartTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Order History</h2></div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : activeOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No orders yet. Go to Menu tab to place your first order!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <tr>{['Order #', 'Date', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(h =>
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  )}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeOrders.map(order => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderNumber ?? order._id.slice(-8)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 font-semibold">Rs. {order.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-700'}`}>{order.status}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{order.paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setViewOrder(order)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">View</button>
                          <button onClick={() => handleViewQR(order._id)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">QR</button>
                          {['pending', 'confirmed'].includes(order.status) && (
                            <button onClick={() => handleCancel(order._id)} disabled={cancelling === order._id}
                              className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                              {cancelling === order._id ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW ORDER DIALOG */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Order #</p><p className="font-mono font-semibold">{viewOrder.orderNumber ?? viewOrder._id.slice(-8)}</p></div>
                <div><p className="text-xs text-slate-500">Date</p><p>{new Date(viewOrder.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span></div>
                <div><p className="text-xs text-slate-500">Payment</p><p>{viewOrder.paymentStatus}</p></div>
                {viewOrder.deliveryAddress && <div className="col-span-2"><p className="text-xs text-slate-500">Delivery Address</p><p>{viewOrder.deliveryAddress}</p></div>}
                {viewOrder.specialInstructions && <div className="col-span-2"><p className="text-xs text-slate-500">Special Instructions</p><p>{viewOrder.specialInstructions}</p></div>}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-slate-50 pb-1">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span><span>Rs. {viewOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              {['pending', 'confirmed'].includes(viewOrder.status) && (
                <button onClick={() => handleCancel(viewOrder._id)}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">Cancel Order</button>
              )}
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE DIALOG */}
      {qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Order QR Code</h2>
              <button onClick={() => setQrCode(null)} className="text-slate-400 text-xl">×</button>
            </div>
            <div className="px-6 py-6 text-center space-y-3">
              <img src={qrCode.qrCode} alt="QR Code" className="mx-auto w-56 h-56 rounded-lg border border-slate-200" />
              <p className="text-sm text-slate-600">Order: <span className="font-mono font-semibold">{qrCode.orderNumber}</span></p>
              <p className="text-xs text-slate-400">Show this QR code when collecting your order</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button onClick={() => window.print()} className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200">Print</button>
              <button onClick={() => setQrCode(null)} className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
