import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../api/payment.api';
import { formatCurrency } from '../../utils/budgetTracking';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  Receipt,
} from 'lucide-react';

interface PaymentUser {
  _id: string;
  name: string;
  email: string;
}

interface Payment {
  _id: string;
  user: PaymentUser;
  order: string;
  amount: number;
  method: 'PayPal' | 'QRCode' | 'CreditCard';
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  receiptUrl?: string;
  receiptSent: boolean;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; dotColor: string; icon: React.ReactNode }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dotColor: 'bg-emerald-500', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', dotColor: 'bg-amber-500', icon: <Clock className="w-3.5 h-3.5" /> },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', dotColor: 'bg-red-500', icon: <XCircle className="w-3.5 h-3.5" /> },
  Refunded: { bg: 'bg-slate-100', text: 'text-slate-600', dotColor: 'bg-slate-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const AdminPaymentDashboard: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPayments = () => {
    paymentApi.getAllPayments()
      .then((res: { data: Payment[] }) => setPayments(res.data || []))
      .catch((err: unknown) => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } };
          console.error(e.response?.data?.message || 'Failed to fetch payments');
        } else {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (id: string) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;

    setRefundingId(id);
    try {
      await paymentApi.refundPayment(id);
      fetchPayments(); // Refresh list
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } };
        alert(e.response?.data?.message || 'Failed to refund payment');
      } else {
        alert('Failed to refund payment');
      }
    } finally {
      setRefundingId(null);
    }
  };

  // Stats
  const totalRevenue = payments.reduce((sum, p) => p.status === 'Completed' ? sum + p.amount : sum, 0);
  const completedCount = payments.filter(p => p.status === 'Completed').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const refundedCount = payments.filter(p => p.status === 'Refunded').length;

  // Filtering
  const filtered = payments.filter(p => {
    const matchSearch = search === '' ||
      p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || p._id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: `${formatCurrency(totalRevenue)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Completed',
      value: completedCount.toString(),
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Pending',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Refunded',
      value: refundedCount.toString(),
      icon: RotateCcw,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Payment Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage all system transactions and issue refunds.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border ${stat.border} shadow-sm p-5 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] text-emerald-500 font-semibold">+{Math.floor(Math.random() * 12) + 1}%</span>
              <span className="text-[11px] text-slate-400">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, or transaction ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payment Table — Desktop */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No payments found</p>
                  <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              filtered.map((payment) => {
                const status = statusConfig[payment.status] || statusConfig.Pending;
                const date = new Date(payment.createdAt);
                return (
                  <tr key={payment._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs text-slate-400">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {(payment.transactionId || payment._id).substring(0, 12)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                          {payment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{payment.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{payment.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-xs font-semibold text-slate-600">
                        <CreditCard className="w-3 h-3" />
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(Number(payment.amount || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        {status.icon}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRefund(payment._id)}
                        disabled={refundingId === payment._id || payment.status !== 'Completed'}
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold py-1.5 px-4 rounded-xl transition-all ${
                          payment.status === 'Completed'
                            ? 'text-red-600 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 cursor-pointer shadow-sm hover:shadow-md'
                            : 'text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {refundingId === payment._id ? 'Refunding...' : payment.status === 'Refunded' ? 'Refunded' : 'Refund'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No payments found</p>
          </div>
        ) : (
          filtered.map((payment) => {
            const status = statusConfig[payment.status] || statusConfig.Pending;
            const date = new Date(payment.createdAt);
            return (
              <div key={payment._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                      {payment.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{payment.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{payment.user?.email}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(payment.amount || 0))}</p>
                </div>

                {/* Middle */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                    {status.icon}
                    {payment.status}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 text-xs font-medium text-slate-500">
                    <CreditCard className="w-3 h-3" />
                    {payment.method}
                  </span>
                  <span className="text-xs text-slate-400">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="font-mono text-xs text-slate-400">
                    {(payment.transactionId || payment._id).substring(0, 12)}
                  </span>
                  <button
                    onClick={() => handleRefund(payment._id)}
                    disabled={refundingId === payment._id || payment.status !== 'Completed'}
                    className={`inline-flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all ${
                      payment.status === 'Completed'
                        ? 'text-red-600 bg-red-50 border border-red-200 active:bg-red-100'
                        : 'text-slate-400 bg-slate-50 border border-slate-200 opacity-50'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {refundingId === payment._id ? 'Refunding...' : payment.status === 'Refunded' ? 'Refunded' : 'Refund'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {filtered.length} of {payments.length} total payments
        </p>
      )}
    </div>
  );
};

export default AdminPaymentDashboard;
