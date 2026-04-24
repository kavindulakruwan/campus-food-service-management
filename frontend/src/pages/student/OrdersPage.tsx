import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Minus, Plus, QrCode, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, UtensilsCrossed, X } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi } from '../../api/order.api'

type OrderCartItem = MealItem & { quantity: number }
type CategoryFilter = 'all' | MealItem['category']
type OrderStatusFilter = 'all' | 'Pending' | 'Processing' | 'Ready' | 'Completed'

const categoryOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
  { label: 'Beverage', value: 'beverage' },
]

const requirements = [
  { title: 'Instant Access', description: 'Scan a QR code to open the menu without waiting at the counter.' },
  { title: 'Seamless Ordering', description: 'Add items to cart, review totals, and place the order in one flow.' },
  { title: 'Contactless Payment', description: 'Move straight into checkout with the payment method that fits your order.' },
  { title: 'Live Tracking', description: 'Follow the order status from pending to ready and completed.' },
]

const OrdersPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedMeal = (location.state as { meal?: MealItem } | null)?.meal

  const [meals, setMeals] = useState<MealItem[]>([])
  const [cart, setCart] = useState<OrderCartItem[]>(() => (selectedMeal ? [{ ...selectedMeal, quantity: 1 }] : []))
  const [orders, setOrders] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
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
        setError('Unable to load your existing orders right now.')
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
          availability: 'available',
        })
        setMeals(response.data.data.meals)
      } catch (fetchError) {
        console.error(fetchError)
        setError('Unable to load meal options right now.')
      } finally {
        setLoadingMeals(false)
      }
    }

    void loadMeals()
  }, [query, category])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  )

  const tax = useMemo(() => subtotal * 0.08, [subtotal])
  const grandTotal = useMemo(() => subtotal + tax, [subtotal, tax])
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  const addToCart = (meal: MealItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === meal.id)
      if (existing) {
        return prev.map((item) => (item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item))
      }

      return [...prev, { ...meal, quantity: 1 }]
    })
  }

  const updateQuantity = (mealId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === mealId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('Add at least one meal to the cart before placing an order.')
      return
    }

    setPlacingOrder(true)
    setError('')

    try {
      const response = await orderApi.createOrder({
        items: cart.map((item) => ({
          mealId: item.id,
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, type CreateOrderRequest } from '../../api/order.api';

type OrdersTab = 'menu' | 'orders';
type PaymentMethod = 'Cash' | 'PayPal' | 'QRCode';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tag: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const menuItems: MenuItem[] = [
  {
    id: 'rice-curry',
    name: 'Rice & Curry',
    description: 'Fresh plate with spicy curry and vegetables.',
    price: 350,
    tag: 'Popular',
  },
  {
    id: 'chicken-kottu',
    name: 'Chicken Kottu',
    description: 'Hot shredded roti mixed with veggies and chicken.',
    price: 450,
    tag: 'Chef Pick',
  },
  {
    id: 'egg-hopper-set',
    name: 'Egg Hopper Set',
    description: 'Crispy hopper with egg, sambol and lentil curry.',
    price: 300,
    tag: 'Quick Bite',
  },
  {
    id: 'fruit-smoothie',
    name: 'Fruit Smoothie',
    description: 'Seasonal fruit shake to refresh your day.',
    price: 320,
    tag: 'Fresh',
  },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number) => `Rs. ${currencyFormatter.format(amount)}`;

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrdersTab>('menu');
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('Room 204, Block A');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      const response = await orderApi.getMyOrders();
      setOrders(response.data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load your order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const stats = useMemo(() => {
    const now = new Date();
    const paidOrders = orders.filter((order) => order.paymentStatus === 'Paid');
    const thisMonthSpent = paidOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalOrders: orders.length,
      activeOrders: orders.filter((order) => order.paymentStatus !== 'Paid').length,
      totalSpent: paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      thisMonthSpent,
    };
  }, [orders]);

  const addToCart = (menuItem: MenuItem) => {
    setError('');
    setNotice('');

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === menuItem.id);

      if (existingItem) {
        return currentCart.map((item) => (
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }

      return [...currentCart, { ...menuItem, quantity: 1 }];
    });

    setActiveTab('menu');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((currentCart) => currentCart
      .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Add at least one menu item before placing an order.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address or pickup location.');
      return;
    }

    setPlacingOrder(true);
    setError('');
    setNotice('');

    try {
      const request: CreateOrderRequest = {
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: Number(grandTotal.toFixed(2)),
      })

      const createdOrder = response.data
      const createdOrderId = createdOrder?._id || createdOrder?.id

      const refreshedOrders = await orderApi.getMyOrders()
      setOrders(refreshedOrders.data || [])

      if (createdOrderId) {
        navigate(`/checkout?orderId=${createdOrderId}`)
      } else {
        navigate('/checkout')
      }
    } catch (placeError: any) {
      setError(placeError?.response?.data?.message || 'Failed to place the order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <section className="space-y-8">
      <header className="grid gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6 bg-[linear-gradient(180deg,rgba(255,250,245,0.98),rgba(255,255,255,0.98))] p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
            <QrCode className="h-3.5 w-3.5" />
            Order Booking
          </div>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-light leading-tight tracking-tight text-slate-700 sm:text-5xl">
              Streamlined Order
              <br />
              Booking Experience
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Use the QR-first order flow, browse meals by category, and move from cart to checkout without leaving the campus design system.
            </p>
          </div>

          <div className="space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
            <p><span className="font-bold text-slate-900">Instant Access</span> - Customers can scan a QR code to view menus or products instantly, reducing waiting time and enhancing convenience.</p>
            <p><span className="font-bold text-slate-900">Seamless Ordering</span> - Orders placed via QR code are automatically transmitted to the system, minimizing errors and manual handling.</p>
            <p><span className="font-bold text-slate-900">Contactless Payment</span> - Integrated QR systems allow customers to pay digitally, ensuring faster checkout and a safer experience.</p>
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-[#fbf0e3] px-6 py-10 sm:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_55%)]" />
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-[2rem] border border-orange-100 bg-[#fffaf3] px-5 py-6 shadow-[0_24px_60px_rgba(148,86,39,0.14)]">
            <p className="text-center text-xl font-semibold text-[#7d4f2d]">Order confirmation</p>
            <p className="text-center text-lg font-medium text-[#a96a3a]">Order Delivery app</p>
            <p className="mt-2 max-w-xs text-center text-xs leading-5 text-slate-500">
              Scan, confirm, and track your campus order with a smoother experience.
            </p>

            <div className="mt-6 flex h-[360px] w-[220px] flex-col items-center rounded-[2.5rem] border-[6px] border-slate-900 bg-white px-4 py-5 shadow-2xl">
              <div className="mb-3 h-1.5 w-20 rounded-full bg-slate-200" />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Your Order
              </div>
              <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-100 text-orange-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-900">Order &amp; confirmation</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">Confirm your order, scan the QR, and move to payment in a few taps.</p>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-6 gap-0.5 bg-white p-2">
                  {Array.from({ length: 81 }).map((_, index) => (
                    <span key={index} className={`h-1.5 w-1.5 ${index % 2 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
                  ))}
        totalAmount: cartTotal,
        paymentMethod,
      };

      const response = await orderApi.createOrder(request);
      const createdOrder = response.data;

      setCart([]);
      await loadOrders();

      if (paymentMethod === 'Cash') {
        setNotice(`Order ${createdOrder.orderNumber || createdOrder._id} placed. Cash payment will be collected on delivery.`);
        setActiveTab('orders');
        return;
      }

      navigate(`/checkout?orderId=${createdOrder._id}&method=${paymentMethod}`);
    } catch (placeError: any) {
      console.error(placeError);
      setError(placeError?.response?.data?.message || 'Failed to place the order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getStatusClass = (value: string) => {
    if (value === 'Paid' || value === 'Completed') {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (value === 'Failed') {
      return 'bg-rose-100 text-rose-700';
    }

    if (value === 'Refunded') {
      return 'bg-slate-200 text-slate-700';
    }

    if (value === 'Preparing' || value === 'Processing' || value === 'Pending') {
      return 'bg-amber-100 text-amber-700';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const getPaymentStatusLabel = (order: any) => {
    if (order.paymentStatus === 'Paid') {
      return 'Payment Verified';
    }

    if (order.paymentStatus === 'Refunded') {
      return 'Payment Refunded';
    }

    if (order.paymentStatus === 'Failed') {
      return 'Payment Failed';
    }

    if (order.paymentMethod === 'Cash') {
      return 'Cash Payment Pending';
    }

    if (order.paymentMethod) {
      return 'Awaiting Online Payment';
    }

    return 'Awaiting Payment';
  };

  const getPaymentAction = (order: any) => {
    if (order.paymentStatus === 'Pending' && order.paymentMethod !== 'Cash') {
      return {
        label: 'Pay Now →',
        className: 'bg-emerald-600 text-white hover:bg-emerald-700',
        onClick: () => navigate(
          order.paymentMethod
            ? `/checkout?orderId=${order._id}&method=${order.paymentMethod}`
            : `/checkout?orderId=${order._id}`
        ),
      };
    }

    if (order.paymentStatus === 'Pending' && order.paymentMethod === 'Cash') {
      return {
        label: 'View Pending Payments',
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        onClick: () => navigate('/payments/pending'),
      };
    }

    if (order.paymentStatus === 'Paid') {
      return {
        label: 'View Paid Payments',
        className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        onClick: () => navigate('/payments/paid'),
      };
    }

    if (order.paymentStatus === 'Refunded') {
      return {
        label: 'View Refunded Payments',
        className: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
        onClick: () => navigate('/payments/refunded'),
      };
    }

    if (order.paymentStatus === 'Failed') {
      return {
        label: 'Retry Payment →',
        className: 'bg-rose-600 text-white hover:bg-rose-700',
        onClick: () => navigate(
          order.paymentMethod && order.paymentMethod !== 'Cash'
            ? `/checkout?orderId=${order._id}&method=${order.paymentMethod}`
            : `/checkout?orderId=${order._id}`
        ),
      };
    }

    return {
      label: 'View Payments',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      onClick: () => navigate('/payments'),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-500">Food Orders</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Order Booking</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Build a campus meal order, review your cart, and continue to payment without leaving the booking flow.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'menu' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'orders' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            My Orders
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Active Orders</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.activeOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Spent</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.thisMonthSpent)}</p>
        </div>
      </div>

      {activeTab === 'menu' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.9fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">Available Menu</h2>
            </div>

            <div className="space-y-3 p-4 sm:p-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-orange-200 hover:bg-orange-50/50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                        {item.tag}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm text-slate-500">{item.description}</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(item.price)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
              </div>
              <button className="mt-auto w-full rounded-full border border-orange-300 bg-orange-50 py-2 text-sm font-semibold text-[#8b5228]">
                Order
              </button>
            </div>
          </div>
        </div>
      </header>

              <div className="p-4 sm:p-6">
                {cart.length === 0 ? (
                  <div className="grid min-h-35 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                    Add items from the menu
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -item.quantity)}
                            className="text-sm font-medium text-slate-400 transition hover:text-rose-600"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-semibold text-slate-500 transition hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="min-w-8 px-1 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-semibold text-slate-500 transition hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>

                          <p className="text-sm font-bold text-slate-900">{formatCurrency(item.quantity * item.price)}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-sm text-slate-500">Items</p>
                        <p className="text-xl font-black text-slate-900">{totalItems}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Subtotal</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(cartTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">Order Details</h2>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Delivery Address *</label>
                  <input
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="e.g. Room 204, Block A"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                    placeholder="Any special requests..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'PayPal', 'QRCode'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                          paymentMethod === method
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {paymentMethod === 'Cash'
                      ? 'Cash orders stay pending until the delivery handoff.'
                      : 'Online payment continues on the checkout screen after you place the order.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full rounded-2xl bg-orange-300 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {placingOrder ? 'Placing Order...' : `Place Order - ${formatCurrency(cartTotal)}`}
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-500">No recent orders found in the database.</p>
            </div>
          ) : (
            orders.map((order) => (
              (() => {
                const paymentAction = getPaymentAction(order);

                return (
              <div
                key={order._id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-slate-400">{order.orderNumber || order._id?.substring(0, 8)}</span>
                    <span className="text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {order.items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No Items'}
                    </h3>
                    <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(Number(order.totalAmount || 0))}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={paymentAction.onClick}
                    className={`w-full rounded-2xl px-6 py-3 text-sm font-bold transition lg:w-auto ${paymentAction.className}`}
                  >
                    {paymentAction.label}
                  </button>
                </div>
              </div>
                );
              })()
            ))
          )}
        </div>
      )}
    </div>
  );
};

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {requirements.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Requirement</p>
            <h2 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Browse Menu</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Add meals to your cart</h2>
                <p className="mt-1 text-sm text-slate-600">Search by meal name and filter by category to build the order before checkout.</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                {totalItems} items in cart
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                setQuery(searchText.trim())
              }}
              className="mt-6 grid gap-3 lg:grid-cols-[1.6fr_1fr_auto]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white"
                  placeholder="Search meals for the order"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as CategoryFilter)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500">
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === option.value ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {loadingMeals ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Loading menu options...
              </div>
            ) : meals.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                No meals found for the selected filters.
              </div>
            ) : meals.map((meal) => (
              <article key={meal.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex h-36 items-center justify-between bg-slate-100">
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-orange-400">
                      <UtensilsCrossed className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="line-clamp-1 text-lg font-bold text-slate-900">{meal.name}</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Available</span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-500">{meal.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-orange-500">LKR {meal.price.toFixed(0)}</p>
                    <button
                      type="button"
                      onClick={() => addToCart(meal)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                    >
                      Add to cart
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Scan QR</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Digital menu access</h2>
              </div>
              <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">
                <QrCode className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-6 gap-1 bg-white p-3">
                {Array.from({ length: 64 }).map((_, index) => (
                  <span key={index} className={`h-2 w-2 rounded-[2px] ${index % 3 === 0 || index % 5 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Use campus credentials to verify the account.
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <Clock3 className="h-4 w-4 text-orange-500" />
                Status updates move from pending to ready in real time.
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <Truck className="h-4 w-4 text-slate-700" />
                Order pickup and delivery are tracked on the same screen.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Cart</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">View cart details</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {cart.length} items
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Add a meal from the menu to start the order.
                </div>
              ) : cart.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-white">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-orange-400">
                          <UtensilsCrossed className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">LKR {item.price.toFixed(0)} each</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 0)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-rose-500"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-slate-500 transition hover:text-slate-900"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-8 px-2 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 text-slate-500 transition hover:text-orange-500"
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-slate-900">LKR {(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">LKR {subtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Service charge</span>
                <span className="font-semibold text-slate-900">LKR {tax.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base text-slate-900">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-black text-orange-500">LKR {grandTotal.toFixed(0)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={placingOrder || cart.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                {placingOrder ? 'Placing...' : 'Place Order'}
              </button>
              <Link
                to="/payments/history"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
              >
                <CalendarDays className="h-4 w-4" />
                Track Status
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Recent Orders</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Track order status</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Campus credentials
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'Pending', 'Processing', 'Ready', 'Completed'] as OrderStatusFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === option ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option === 'all' ? 'All' : option}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {loadingOrders ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Loading recent orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No orders match the selected status yet.
                </div>
              ) : filteredOrders.slice(0, 3).map((order) => (
                <article key={order._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber || order._id}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : order.status === 'Ready' ? 'bg-blue-100 text-blue-700' : order.status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm text-slate-600">
                    {order.items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') || 'No items recorded'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Payment</span>
                    <span className={`font-semibold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {order.paymentStatus === 'Paid' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p>
          Need to choose a different meal? <Link to="/meals" className="font-semibold text-orange-600 hover:text-orange-700">Go back to Meals</Link>
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <MapPin className="h-4 w-4 text-orange-500" />
          Campus delivery flow
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </section>
  )
}

export default OrdersPage
