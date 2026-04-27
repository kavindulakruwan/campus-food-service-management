import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  QrCode,
  Receipt,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { paymentApi } from '../../api/payment.api';
import { orderApi } from '../../api/order.api';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface StudentOrder {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Ready' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod: 'Cash' | 'PayPal' | 'QRCode';
  createdAt: string;
}

interface PaymentHistoryRow {
  _id: string;
  transactionId?: string;
  method: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  createdAt: string;
  order?: string | { _id?: string; items?: OrderItem[] };
  orderId?: string;
  isSyntheticOrderPayment?: boolean;
}

interface InitiatedPayment {
  paymentId: string;
  amount: number;
  qrData?: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="h-3.5 w-3.5" /> },
  Refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const categoryFromMethod = (method: string) => {
  if (method === 'PayPal') return { label: 'PayPal', color: 'bg-blue-50 text-blue-700' };
  if (method === 'QRCode') return { label: 'QR Scan', color: 'bg-teal-50 text-teal-700' };
  if (method === 'Cash') return { label: 'Cash', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Other', color: 'bg-slate-50 text-slate-600' };
};

const isOrderPendingForPayment = (order: StudentOrder) => {
  return order.status !== 'Cancelled' && order.status !== 'Completed' && order.paymentStatus !== 'Paid';
};

const mapOrderToPaymentStatus = (order: StudentOrder): PaymentHistoryRow['status'] => {
  if (order.paymentStatus === 'Paid' || order.status === 'Completed') return 'Completed';
  if (order.paymentStatus === 'Refunded') return 'Refunded';
  if (order.paymentStatus === 'Failed') return 'Failed';
  return 'Pending';
};

const PaymentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<StudentOrder[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'PayPal' | 'QRCode'>('PayPal');
  const [initiatedPayment, setInitiatedPayment] = useState<InitiatedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Failed' | 'Refunded'>('All');
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.pathname === '/payments/pending') {
      setStatusFilter('Pending');
      return;
    }

    if (location.pathname === '/payments/paid') {
      setStatusFilter('Completed');
      return;
    }

    if (location.pathname === '/payments/refunded') {
      setStatusFilter('Refunded');
      return;
    }

    const requestedFilter = searchParams.get('filter');
    if (requestedFilter === 'Pending' || requestedFilter === 'Completed' || requestedFilter === 'Failed' || requestedFilter === 'Refunded') {
      setStatusFilter(requestedFilter);
      return;
    }

    setStatusFilter('All');
  }, [location.pathname, searchParams]);

  useEffect(() => {
    const requestedMethod = searchParams.get('method');
    if (requestedMethod === 'PayPal' || requestedMethod === 'QRCode') {
      setSelectedMethod(requestedMethod);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderResponse, paymentResponse] = await Promise.all([orderApi.getMyOrders(), paymentApi.getHistory()]);
      const orderRows = Array.isArray(orderResponse?.data) ? orderResponse.data : [];
      const paymentRows = Array.isArray(paymentResponse?.data) ? paymentResponse.data : [];
      setOrders(orderRows);
      setPayments(paymentRows);
      setError('');
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load orders and payment history right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => isOrderPendingForPayment(order)),
    [orders],
  );

  useEffect(() => {
    const requestedOrderId = searchParams.get('orderId');

    if (requestedOrderId && pendingOrders.some((order) => order._id === requestedOrderId)) {
      setSelectedOrderId(requestedOrderId);
      return;
    }

    if (!selectedOrderId && pendingOrders.length > 0) {
      setSelectedOrderId(pendingOrders[0]._id);
    }
  }, [searchParams, pendingOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => pendingOrders.find((order) => order._id === selectedOrderId) || null,
    [pendingOrders, selectedOrderId],
  );

  const paymentRows = useMemo(() => {
    const orderIdsWithPayment = new Set(
      payments
        .map((payment) => {
          const orderRef = payment.order;
          if (!orderRef) return '';
          if (typeof orderRef === 'string') return orderRef;
          return orderRef._id || '';
        })
        .filter(Boolean),
    );

    const syntheticRows: PaymentHistoryRow[] = orders
      .filter((order) => !orderIdsWithPayment.has(order._id))
      .map((order) => ({
        _id: `order-${order._id}`,
        transactionId: order.orderNumber || order._id,
        method: order.paymentMethod || 'Cash',
        amount: Number(order.totalAmount || 0),
        status: mapOrderToPaymentStatus(order),
        createdAt: order.createdAt,
        orderId: order._id,
        isSyntheticOrderPayment: true,
      }));

    return [...payments, ...syntheticRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders, payments]);

  const filteredRows = useMemo(() => {
    return paymentRows.filter((payment) => {
      const transactionLabel = (payment.transactionId || payment._id).toLowerCase();
      const matchesSearch =
        search.trim() === '' ||
        transactionLabel.includes(search.toLowerCase()) ||
        payment.method.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paymentRows, search, statusFilter]);

  const completedRows = useMemo(
    () => paymentRows.filter((row) => row.status === 'Completed'),
    [paymentRows],
  );

  const totalPaidAmount = useMemo(
    () => completedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [completedRows],
  );

  const initiatePayment = async () => {
    if (!selectedOrder) {
      setError('Please select a pending order first.');
      return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const response = await paymentApi.initiate({
        orderId: selectedOrder._id,
        method: selectedMethod,
      });

      setInitiatedPayment({
        paymentId: response.paymentId,
        amount: Number(response.amount || selectedOrder.totalAmount),
        qrData: response.qrData,
      });
    } catch (paymentError: any) {
      setError(paymentError?.response?.data?.message || 'Failed to initialize payment.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const verifyPayment = async (success: boolean) => {
    if (!initiatedPayment?.paymentId) return;

    setProcessingPayment(true);
    try {
      await paymentApi.verify(initiatedPayment.paymentId, success);
      setInitiatedPayment(null);
      await loadData();

      if (success) {
        setStatusFilter('Completed');
      }
    } catch (verificationError: any) {
      setError(verificationError?.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange-200 border-t-orange-500" />
        <p className="text-sm font-medium text-slate-400">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-orange-200/50 bg-[radial-gradient(circle_at_top_right,rgba(254,215,170,0.22),transparent_36%),linear-gradient(120deg,#0f172a_0%,#1e293b_45%,#ea580c_100%)] p-6 text-white shadow-[0_25px_70px_-22px_rgba(234,88,12,0.7)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-14 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-24 h-44 w-44 rounded-full bg-orange-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-6 top-1/3 h-28 w-28 rounded-full border border-white/25" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Payment Lounge
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Payments</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/85 sm:text-base">
              Complete pending orders faster and monitor every receipt from a beautiful finance cockpit.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Create New Order
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15">
            <p className="text-xs uppercase tracking-wide text-orange-100/90">Pending Orders</p>
            <p className="mt-1 text-2xl font-black">{pendingOrders.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15">
            <p className="text-xs uppercase tracking-wide text-orange-100/90">Completed Payments</p>
            <p className="mt-1 text-2xl font-black">{completedRows.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15">
            <p className="text-xs uppercase tracking-wide text-orange-100/90">Total Paid</p>
            <p className="mt-1 text-2xl font-black">${totalPaidAmount.toFixed(2)}</p>
          </article>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/40">
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Pending Orders
          </h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {pendingOrders.length} awaiting payment
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            No pending orders right now. Any successful payment will move an order to Completed.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <select
                value={selectedOrderId}
                onChange={(event) => {
                  setSelectedOrderId(event.target.value);
                  setInitiatedPayment(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-orange-500/25 focus:bg-white focus:ring"
              >
                {pendingOrders.map((order) => (
                  <option key={order._id} value={order._id}>
                    {order.orderNumber || order._id} - ${Number(order.totalAmount || 0).toFixed(2)}
                  </option>
                ))}
              </select>

              {selectedOrder && (
                <div className="rounded-2xl border border-orange-100 bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_52%,#ffedd5_100%)] p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Order #{selectedOrder.orderNumber || selectedOrder._id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(selectedOrder.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="mt-3 space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                        <span className="text-slate-700">{item.name} x {item.quantity}</span>
                        <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Total</span>
                      <span className="text-xl font-black text-orange-600">${Number(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_50%,#fff7ed_100%)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment Options</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('PayPal');
                    setInitiatedPayment(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    selectedMethod === 'PayPal'
                      ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  PayPal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod('QRCode');
                    setInitiatedPayment(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    selectedMethod === 'QRCode'
                      ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  QR Payment
                </button>
              </div>

              <button
                type="button"
                onClick={initiatePayment}
                disabled={processingPayment || !selectedOrder}
                className="w-full rounded-lg bg-linear-to-r from-slate-900 to-slate-700 px-3 py-2.5 text-sm font-semibold text-white hover:from-slate-800 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingPayment ? 'Processing checkout...' : 'Checkout'}
              </button>

              <div className="rounded-lg border border-orange-100 bg-white/80 px-3 py-2 text-[11px] text-slate-500">
                Secure checkout. Your payment status updates automatically in the history table.
              </div>

              {initiatedPayment && selectedMethod === 'QRCode' && (
                <div className="space-y-3 rounded-xl border border-teal-200 bg-[linear-gradient(145deg,#f0fdfa_0%,#ffffff_100%)] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <QrCode className="h-4 w-4 text-orange-500" />
                    Scan to Pay
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(initiatedPayment.qrData || '')}`}
                    alt="Payment QR code"
                    className="mx-auto h-40 w-40 rounded-lg border border-slate-200"
                  />
                  <p className="text-center text-xs text-slate-500">Amount: ${initiatedPayment.amount.toFixed(2)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => verifyPayment(true)}
                      disabled={processingPayment}
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                    >
                      Confirm Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyPayment(false)}
                      disabled={processingPayment}
                      className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              )}

              {initiatedPayment && selectedMethod === 'PayPal' && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-3 text-xs font-semibold text-slate-500">Complete PayPal payment</p>
                  <PayPalScriptProvider options={{ clientId: 'test', currency: 'USD', intent: 'capture' }}>
                    <PayPalButtons
                      createOrder={(_data, actions) => {
                        return actions.order.create({
                          intent: 'CAPTURE',
                          purchase_units: [{ amount: { currency_code: 'USD', value: initiatedPayment.amount.toFixed(2) } }],
                        });
                      }}
                      onApprove={async (_data, actions) => {
                        if (actions.order) {
                          await actions.order.capture();
                          await verifyPayment(true);
                        }
                      }}
                      onCancel={async () => {
                        await verifyPayment(false);
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by transaction or method"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-orange-500/25 focus:bg-white focus:ring sm:w-72"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-orange-500/25 focus:bg-white focus:ring"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No payment records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.Pending;
                  const methodCategory = categoryFromMethod(payment.method);
                  const rowDate = new Date(payment.createdAt);

                  return (
                    <tr key={payment._id} className="transition even:bg-slate-50/40 hover:bg-orange-50/50">
                      <td className="px-4 py-3 text-slate-700">
                        {rowDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {(payment.transactionId || payment._id).slice(0, 14)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${methodCategory.color}`}>
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">${Number(payment.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.icon}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payment.isSyntheticOrderPayment && payment.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (payment.orderId) {
                                setSelectedOrderId(payment.orderId);
                                setInitiatedPayment(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="inline-flex rounded-md px-2 py-1 text-xs font-semibold text-orange-600 transition hover:bg-orange-100 hover:text-orange-700"
                          >
                            Pay Now
                          </button>
                        ) : payment.isSyntheticOrderPayment ? (
                          <span className="text-xs text-slate-400">No receipt</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/payments/receipt/${payment._id}`)}
                            className="inline-flex rounded-md px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PaymentsPage;
