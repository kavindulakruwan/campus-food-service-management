<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';

const MENU = [
  { id: 'meal-1', name: 'Rice & Curry', description: 'Fresh plate with spicy curry and vegetables.', price: 350 },
  { id: 'meal-2', name: 'Chicken Kottu', description: 'Hot shredded roti mixed with veggies and chicken.', price: 450 },
  { id: 'meal-3', name: 'Egg Hopper Set', description: 'Crispy hopper with egg, sambol and lentil curry.', price: 300 },
  { id: 'meal-4', name: 'Fruit Smoothie', description: 'Seasonal fruit shake to refresh your day.', price: 320 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  Ready: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900',
  Completed: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
  Cancelled: 'bg-red-100 text-red-800',
};

type CartItem = { id: string; name: string; price: number; quantity: number };
type OrderItem = { name: string; quantity: number; price: number };
type Order = {
  _id: string; orderNumber?: string; status: string; paymentStatus: string;
  totalAmount: number; createdAt: string; items: OrderItem[];
  deliveryAddress?: string; specialInstructions?: string;
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [qrCode, setQrCode] = useState<{ qrCode: string; orderNumber: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'history'>('menu');
  const navigate = useNavigate();

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders();
      const data = (res.data as { data?: Order[] })?.data ?? (res.data as Order[]) ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    setCart(prev => qty <= 0 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  // CREATE
  const handleCreateOrder = async () => {
    if (cart.length === 0) { setError('Please add at least one item'); return; }
    if (!deliveryAddress.trim()) { setError('Please enter delivery address'); return; }
    setCreating(true); setError('');
    try {
      await orderApi.createOrder({
        items: cart.map(({ name, price, quantity }) => ({ name, price, quantity })),
        deliveryAddress, specialInstructions, paymentMethod,
      });
      setSuccess('Order placed successfully!');
      setCart([]); setDeliveryAddress(''); setSpecialInstructions(''); setPaymentMethod('cash');
      setActiveTab('history');
      fetchOrders();
      // Navigate to payment page with new order details
      const orderData = (res.data as any)?.data ?? (res.data as any);
      if (orderData?._id) {
        navigate(`/payments?orderId=${orderData._id}&amount=${orderData.totalAmount}`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to place order');
    } finally { setCreating(false); }
  };

  // READ - QR code
  const handleViewQR = async (orderId: string) => {
    try {
      const res = await orderApi.getQRCode(orderId);
      const d = (res.data as any)?.data ?? (res.data as any);
      if (d?.qrCode) {
        setQrCode({ qrCode: d.qrCode, orderNumber: d.orderNumber ?? '' });
      } else {
        setError('QR code not available for this order');
      }
    } catch { setError('Failed to load QR code'); }
  };

  // DELETE (cancel)
  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await orderApi.cancelOrder(orderId);
      setSuccess('Order cancelled successfully');
      setViewOrder(null);
      fetchOrders();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to cancel order');
    } finally { setCancelling(null); }
  };

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'Cancelled');
  const totalSpent = orders.filter(o => o.status !== 'cancelled' && o.status !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const thisMonthSpent = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'Cancelled' && new Date(o.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-600">Food Orders</p>
          <h1 className="text-3xl font-bold text-gray-900">Order Booking</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'menu' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Menu {cartCount > 0 && <span className="ml-1 bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs">{cartCount}</span>}
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'history' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Available Menu</h2></div>
            <div className="p-4 grid gap-3">
              {MENU.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 hover:border-orange-200 transition">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">Rs. {item.price.toFixed(2)}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100 font-bold flex items-center justify-center hover:bg-gray-200">−</button>
                        <span className="w-6 text-center font-semibold">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center hover:bg-gray-700">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition">Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Your Cart</h2>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>}
              </div>
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">Add items from the menu</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Rs. {item.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-100 text-sm flex items-center justify-center">−</button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-50 text-red-500 text-sm flex items-center justify-center ml-1">×</button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                      <span>Total</span><span>Rs. {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <h2 className="font-semibold text-gray-900">Order Details</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address *</label>
                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Room 204, Block A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Special Instructions</label>
                <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                  rows={2} placeholder="Any special requests..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
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
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Order History</h2></div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : activeOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No orders yet. Go to Menu tab to place your first order!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>{['Order #', 'Date', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(h =>
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  )}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeOrders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderNumber ?? order._id.slice(-8)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 font-semibold">Rs. {order.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{order.paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setViewOrder(order)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">View</button>
                          <button onClick={() => handleViewQR(order._id)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">QR</button>
                          {order.paymentStatus === 'Pending' && order.status !== 'Cancelled' && (
                            <button onClick={() => navigate(`/payments?orderId=${order._id}&amount=${order.totalAmount}`)}
                              className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold">Pay</button>
                          )}
                          {['pending', 'confirmed', 'Pending', 'Processing'].includes(order.status) && (
                            <button onClick={() => handleCancel(order._id)} disabled={cancelling === order._id}
                              className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                              {cancelling === order._id ? '...' : 'Cancel'}
                            </button>
                          )}                        </div>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Order #</p><p className="font-mono font-semibold">{viewOrder.orderNumber ?? viewOrder._id.slice(-8)}</p></div>
                <div><p className="text-xs text-gray-500">Date</p><p>{new Date(viewOrder.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span></div>
                <div><p className="text-xs text-gray-500">Payment</p><p>{viewOrder.paymentStatus}</p></div>
                {viewOrder.deliveryAddress && <div className="col-span-2"><p className="text-xs text-gray-500">Delivery Address</p><p>{viewOrder.deliveryAddress}</p></div>}
                {viewOrder.specialInstructions && <div className="col-span-2"><p className="text-xs text-gray-500">Special Instructions</p><p>{viewOrder.specialInstructions}</p></div>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>Rs. {viewOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              {['pending', 'confirmed', 'Pending', 'Processing'].includes(viewOrder.status) && (
                <button onClick={() => handleCancel(viewOrder._id)}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">Cancel Order</button>
              )}
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE DIALOG */}
      {qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Order QR Code</h2>
              <button onClick={() => setQrCode(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="px-6 py-6 text-center space-y-3">
              <img src={qrCode.qrCode} alt="QR Code" className="mx-auto w-56 h-56 rounded-lg border border-gray-200" />
              <p className="text-sm text-gray-600">Order: <span className="font-mono font-semibold">{qrCode.orderNumber}</span></p>
              <p className="text-xs text-gray-400">Show this QR code when collecting your order</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => window.print()} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Print</button>
              <button onClick={() => setQrCode(null)} className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
=======
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clock3, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi, type CreateOrderRequest } from '../../api/order.api'

type CategoryFilter = 'all' | MealItem['category']
type OrderStatusFilter = 'All' | 'Pending' | 'Completed' | 'Cancelled'
type PaymentMethod = 'Cash' | 'PayPal' | 'QRCode'
type OrderCartItem = MealItem & { quantity: number }

interface StudentOrder {
  _id: string
  id?: string
  orderNumber?: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  status: 'Pending' | 'Processing' | 'Ready' | 'Completed' | 'Cancelled'
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  paymentMethod: PaymentMethod
  createdAt: string
}

const categoryOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
  { label: 'Beverage', value: 'beverage' },
]

const getOrderId = (order: StudentOrder) => order._id || order.id || ''

const getOrderCategory = (order: StudentOrder): Exclude<OrderStatusFilter, 'All'> => {
  if (order.status === 'Cancelled') return 'Cancelled'
  if (order.status === 'Completed' || order.paymentStatus === 'Paid') return 'Completed'
  return 'Pending'
}

const OrdersPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedMeal = (location.state as { meal?: MealItem } | null)?.meal

  const [meals, setMeals] = useState<MealItem[]>([])
  const [cart, setCart] = useState<OrderCartItem[]>(() => (selectedMeal ? [{ ...selectedMeal, quantity: 1 }] : []))
  const [orders, setOrders] = useState<StudentOrder[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('All')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await orderApi.getMyOrders()
        setOrders(response.data || [])
      } catch (fetchError) {
        console.error(fetchError)
        setError('Failed to load your order history.')
      } finally {
        setLoadingOrders(false)
      }
    }

    void loadOrders()
  }, [])

  useEffect(() => {
    const loadMeals = async () => {
      setLoadingMeals(true)
      try {
        const response = await getMeals({
          search: query,
          category,
          availability: 'all',
        })
        setMeals(response.data.data.meals || [])
      } catch (fetchError) {
        console.error(fetchError)
        setError('Unable to load meals right now.')
      } finally {
        setLoadingMeals(false)
      }
    }

    void loadMeals()
  }, [query, category])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return orders
    return orders.filter((order) => getOrderCategory(order) === statusFilter)
  }, [orders, statusFilter])

  const orderCounts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => getOrderCategory(order) === 'Pending').length,
      completed: orders.filter((order) => getOrderCategory(order) === 'Completed').length,
      cancelled: orders.filter((order) => getOrderCategory(order) === 'Cancelled').length,
    }),
    [orders],
  )

  const addToCart = (meal: MealItem) => {
    setError('')
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === meal.id)
      if (existingItem) {
        return currentCart.map((item) => (item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item))
      }

      return [...currentCart, { ...meal, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('Add at least one meal before placing an order.')
      return
    }

    setPlacingOrder(true)
    setError('')

    try {
      const request: CreateOrderRequest = {
        items: cart.map((item) => ({
          mealId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: Number(subtotal.toFixed(2)),
        paymentMethod,
      }

      const response = await orderApi.createOrder(request)
      const createdOrder = response.data?.data || response.data
      const createdOrderId = createdOrder?._id || createdOrder?.id

      setCart([])
      await loadOrders()

      if (paymentMethod === 'Cash') {
        return
      }

      if (createdOrderId) {
        navigate(`/payments?orderId=${createdOrderId}&method=${paymentMethod}`)
      } else {
        navigate('/payments')
      }
    } catch (placeError: any) {
      setError(placeError?.response?.data?.message || 'Failed to place order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const getStatusClass = (status: string) => {
    if (status === 'Completed') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Processing' || status === 'Pending') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">Food Orders</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Order Booking</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Build a campus meal order, review your cart, and continue to payment without leaving the booking flow.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meals"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500/30 focus:ring"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500/30 focus:ring"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Build your order, then use the order tracker to proceed to payment.
            </div>
          </div>
>>>>>>> e9d2b905e0f7ace13fb2490b76b92ea117b4ea26

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 font-semibold text-slate-800">Available Meals</div>
            <div className="space-y-3">
              {loadingMeals ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading meals...
                </div>
              ) : meals.length === 0 ? (
                <div className="text-sm text-slate-500">No meals found for your filter.</div>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{meal.name}</p>
                      <p className="text-sm text-slate-500">
                        {meal.category} · ${meal.price.toFixed(2)} · Stock: {meal.quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(meal)}
                      disabled={!meal.isAvailable || meal.quantity <= 0}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {!meal.isAvailable || meal.quantity <= 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Cart</div>
            <div className="space-y-3 p-4">
              {cart.length === 0 ? (
                <div className="text-sm text-slate-500">Your cart is empty.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500">${(item.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="rounded bg-slate-100 p-1 hover:bg-slate-200">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="rounded bg-slate-100 p-1 hover:bg-slate-200">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </p>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="PayPal">PayPal</option>
                  <option value="QRCode">QRCode</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={placingOrder}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? 'Placing order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">My Orders</div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({orderCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Pending')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Pending ({orderCounts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Completed')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Completed ({orderCounts.completed})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Cancelled')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Cancelled' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Cancelled ({orderCounts.cancelled})
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                  No orders available.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={getOrderId(order)} className="rounded-xl border border-slate-100 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">Order #{order.orderNumber || getOrderId(order)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-1 font-medium ${getStatusClass(getOrderCategory(order))}`}>
                        {getOrderCategory(order)}
                      </span>
                      <span className="font-semibold text-slate-700">${Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    {getOrderCategory(order) === 'Pending' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const orderId = getOrderId(order)
                          if (!orderId) return
                          navigate(`/payments?orderId=${orderId}&method=${order.paymentMethod || 'PayPal'}`)
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        Proceed to Payment
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OrdersPage
