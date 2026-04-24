import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi, type CreateOrderRequest } from '../../api/order.api'

type CategoryFilter = 'all' | MealItem['category']
type OrderStatusFilter = 'all' | 'Pending' | 'Processing' | 'Ready' | 'Completed'
type PaymentMethod = 'Cash' | 'PayPal' | 'QRCode'
type OrderCartItem = MealItem & { quantity: number }

const categoryOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
  { label: 'Beverage', value: 'beverage' },
]

const OrdersPage = () => {
  const navigate = useNavigate()

  const [meals, setMeals] = useState<MealItem[]>([])
  const [cart, setCart] = useState<OrderCartItem[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = async () => {
    try {
      const response = await orderApi.getMyOrders()
      setOrders(response.data || [])
    } catch (fetchError) {
      console.error(fetchError)
      setError('Unable to load your orders right now.')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  useEffect(() => {
    const loadMeals = async () => {
      setLoadingMeals(true)
      try {
        const response = await getMeals({
          search: query,
          category,
          availability: 'available',
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
    if (statusFilter === 'all') return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  const addToCart = (meal: MealItem) => {
    setError('')
    setCart((prev) => {
      const existing = prev.find((item) => item.id === meal.id)
      if (existing) {
        return prev.map((item) => (item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...meal, quantity: 1 }]
    })
  }

  const updateQuantity = (mealId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === mealId ? { ...item, quantity: item.quantity + delta } : item))
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
      const createdOrder = response.data
      const createdOrderId = createdOrder?._id || createdOrder?.id

      setCart([])
      await loadOrders()

      if (paymentMethod === 'Cash') return

      if (createdOrderId) {
        navigate(`/checkout?orderId=${createdOrderId}&method=${paymentMethod}`)
      } else {
        navigate('/checkout')
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

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Browse meals, place orders, and continue to payment.</p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
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
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500/30 focus:ring"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Ready">Ready</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Available Meals</div>
            <div className="space-y-3 p-4">
              {loadingMeals ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading meals...
                </div>
              ) : meals.length === 0 ? (
                <div className="text-sm text-slate-500">No meals found for your filter.</div>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{meal.name}</p>
                      <p className="text-sm text-slate-500">{meal.category} · ${meal.price.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(meal)}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">My Orders</div>
            <div className="space-y-3 p-4">
              {loadingOrders ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Loading orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                  No orders available.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order._id || order.id} className="rounded-xl border border-slate-100 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">Order #{order._id || order.id}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-1 font-medium ${getStatusClass(order.status)}`}>{order.status || 'Pending'}</span>
                      <span className="font-semibold text-slate-700">${Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrdersPage
