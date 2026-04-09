import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import {
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  ChefHat,
  CreditCard,
  ArrowRight,
  Package,
  AlertCircle,
} from 'lucide-react';

const orderStatusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Preparing: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <ChefHat className="w-3.5 h-3.5" /> },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
};

const paymentStatusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Pending: { bg: 'bg-red-50', text: 'text-red-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      await orderApi.createOrder();
      const res = await orderApi.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    orderApi.getMyOrders()
      .then(res => setOrders(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your campus food orders and pending payments.</p>
        </div>
        <button
          onClick={handleCreateOrder}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.97] disabled:opacity-70 self-start sm:self-auto"
        >
          {creating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Quick Order
            </>
          )}
        </button>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-800">No orders yet</p>
            <p className="text-sm text-slate-400 mt-1">Create a quick order to get started.</p>
            <button
              onClick={handleCreateOrder}
              disabled={creating}
              className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Create First Order
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const oStatus = orderStatusConfig[order.status] || orderStatusConfig.Pending;
            const pStatus = order.paymentStatus === 'Paid' ? paymentStatusConfig.Paid : paymentStatusConfig.Pending;
            const date = new Date(order.createdAt);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-orange-200 transition-all"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left: Order Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Order meta row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                            {order.orderNumber || order._id.substring(0, 8)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Items */}
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                          {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'No Items'}
                        </h3>

                        {/* Price + Status badges */}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="text-xl font-black text-slate-900">
                            ${order.totalAmount?.toFixed(2) || '0.00'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${oStatus.bg} ${oStatus.text}`}>
                            {oStatus.icon}
                            {order.status}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${pStatus.bg} ${pStatus.text}`}>
                            {pStatus.icon}
                            {order.paymentStatus === 'Paid' ? 'Verified' : 'Awaiting Payment'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="sm:ml-4 shrink-0">
                      {order.paymentStatus === 'Pending' ? (
                        <button
                          onClick={() => navigate(`/checkout?orderId=${order._id}`)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-[0.97]"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay Now
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/payments/history')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                          View History
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
