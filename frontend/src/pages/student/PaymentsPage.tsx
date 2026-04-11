import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';
import { orderApi } from '../../api/order.api';

type PaymentFilter = 'All' | 'Pending' | 'Paid' | 'Refunded';

const getPaymentGroup = (status: string): PaymentFilter => {
  if (status === 'Completed') {
    return 'Paid';
  }

  if (status === 'Refunded') {
    return 'Refunded';
  }

  if (status === 'Pending') {
    return 'Pending';
  }

  return 'All';
};

const PaymentsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<PaymentFilter>('All');
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/payments/pending') {
      setActiveFilter('Pending');
      return;
    }

    if (location.pathname === '/payments/paid') {
      setActiveFilter('Paid');
      return;
    }

    if (location.pathname === '/payments/refunded') {
      setActiveFilter('Refunded');
      return;
    }

    const requestedFilter = searchParams.get('filter');

    if (requestedFilter === 'Pending' || requestedFilter === 'Paid' || requestedFilter === 'Refunded' || requestedFilter === 'All') {
      setActiveFilter(requestedFilter);
      return;
    }

    if (requestedFilter === 'Completed') {
      setActiveFilter('Paid');
      return;
    }

    setActiveFilter('All');
  }, [location.pathname, searchParams]);

  useEffect(() => {
    Promise.all([paymentApi.getHistory(), orderApi.getMyOrders()])
      .then(([paymentRes, orderRes]) => {
        const paymentRows = paymentRes.data || [];
        const orders = orderRes.data || [];

        const orderIdsWithPayment = new Set(
          paymentRows
            .map((payment: any) => (payment.order?._id || payment.order || '').toString())
            .filter(Boolean)
        );

        const mappedOrdersWithoutPayment = orders
          .filter((order: any) => !orderIdsWithPayment.has(String(order._id)))
          .map((order: any) => ({
            _id: `order-${order._id}`,
            transactionId: order.orderNumber || order._id,
            method: order.paymentMethod || 'Cash',
            amount: Number(order.totalAmount || 0),
            status:
              order.paymentStatus === 'Paid'
                ? 'Completed'
                : order.paymentStatus === 'Refunded'
                  ? 'Refunded'
                  : order.paymentStatus === 'Failed'
                    ? 'Failed'
                    : 'Pending',
            createdAt: order.createdAt,
            order: order._id,
            orderId: order._id,
            isSyntheticOrderPayment: true,
          }));

        const mergedRows = [...paymentRows, ...mappedOrdersWithoutPayment]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPayments(mergedRows);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts = {
      all: payments.length,
      pending: 0,
      paid: 0,
      refunded: 0,
    };

    payments.forEach((payment) => {
      const group = getPaymentGroup(payment.status);
      if (group === 'Pending') {
        counts.pending += 1;
      }

      if (group === 'Paid') {
        counts.paid += 1;
      }

      if (group === 'Refunded') {
        counts.refunded += 1;
      }
    });

    return counts;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (activeFilter === 'All') {
      return payments;
    }

    return payments.filter((payment) => getPaymentGroup(payment.status) === activeFilter);
  }, [activeFilter, payments]);

  const handleProcessPending = (payment: any) => {
    const orderId = payment.orderId || payment.order?._id || payment.order;
    if (!orderId) {
      return;
    }

    if (payment.method === 'Cash') {
      return;
    }

    navigate(`/checkout?orderId=${orderId}&method=${payment.method}&paymentId=${payment._id}`);
  };

  const goToFilter = (filter: PaymentFilter) => {
    if (filter === 'All') {
      navigate('/payments');
      return;
    }

    navigate(`/payments/${filter.toLowerCase()}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 mt-1">Track pending, paid, and refunded payments in one place.</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm"
        >
          New Payment
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => goToFilter('All')}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            activeFilter === 'All' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">All</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{statusCounts.all}</p>
        </button>
        <button
          type="button"
          onClick={() => goToFilter('Pending')}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            activeFilter === 'Pending' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{statusCounts.pending}</p>
        </button>
        <button
          type="button"
          onClick={() => goToFilter('Paid')}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            activeFilter === 'Paid' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{statusCounts.paid}</p>
        </button>
        <button
          type="button"
          onClick={() => goToFilter('Refunded')}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            activeFilter === 'Refunded' ? 'border-slate-500 bg-slate-100' : 'border-gray-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">Refunded</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{statusCounts.refunded}</p>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payments found for this status.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {payment.transactionId || payment._id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'Refunded' ? 'bg-slate-200 text-slate-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'Completed' ? 'Paid' : payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        {payment.status === 'Pending' && payment.method !== 'Cash' ? (
                          <button
                            type="button"
                            onClick={() => handleProcessPending(payment)}
                            className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors"
                          >
                            Pay now →
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            if (payment.isSyntheticOrderPayment) {
                              navigate('/orders');
                              return;
                            }

                            navigate(`/payments/receipt/${payment._id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          {payment.isSyntheticOrderPayment
                            ? 'Order →'
                            : payment.status === 'Pending'
                              ? 'Invoice →'
                              : 'Receipt →'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
