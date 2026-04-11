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

export default OrdersPage;
