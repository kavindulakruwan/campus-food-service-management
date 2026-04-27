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
