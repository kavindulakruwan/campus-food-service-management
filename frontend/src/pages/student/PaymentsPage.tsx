import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';
import {
  Search,
  CreditCard,
  ArrowUpRight,
  X,
  Download,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Receipt,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';

interface PaymentItem {
  _id: string;
  transactionId?: string;
  method: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  order?: { items?: { name: string; quantity: number; price: number }[] };
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  Refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const categoryFromMethod = (method: string) => {
  switch (method) {
    case 'PayPal': return { label: 'Online', color: 'bg-blue-50 text-blue-700' };
    case 'QRCode': return { label: 'QR Scan', color: 'bg-violet-50 text-violet-700' };
    case 'CreditCard': return { label: 'Card', color: 'bg-teal-50 text-teal-700' };
    default: return { label: 'Other', color: 'bg-slate-50 text-slate-600' };
  }
};

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    paymentApi.getHistory()
      .then(res => setPayments(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openReceipt = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setPanelOpen(true);
  };

  const closeReceipt = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedPayment(null), 300);
  };

  const filtered = payments.filter(p => {
    const matchSearch = search === '' ||
      (p.transactionId || p._id).toLowerCase().includes(search.toLowerCase()) ||
      p.method.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500 mt-1 text-sm">Review and manage your campus transactions and digital receipts.</p>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.97] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Payment
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by transaction ID or method..."
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
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No payments found</p>
                  <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              filtered.map(payment => {
                const cat = categoryFromMethod(payment.method);
                const status = statusConfig[payment.status] || statusConfig.Pending;
                const date = new Date(payment.createdAt);
                return (
                  <tr
                    key={payment._id}
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    onClick={() => openReceipt(payment)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs text-slate-400">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Campus Food Services</p>
                          <p className="text-xs text-slate-400 font-mono">ID: {(payment.transactionId || payment._id).substring(0, 10)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">${payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                        {status.icon}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-orange-500 group-hover:text-orange-600 font-semibold text-sm transition-colors">
                        Receipt
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
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
          filtered.map(payment => {
            const cat = categoryFromMethod(payment.method);
            const status = statusConfig[payment.status] || statusConfig.Pending;
            const date = new Date(payment.createdAt);
            return (
              <button
                key={payment._id}
                onClick={() => openReceipt(payment)}
                className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-left hover:border-orange-200 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4.5 h-4.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Campus Food Services</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {(payment.transactionId || payment._id).substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900">${payment.amount.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.icon}
                      {payment.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${cat.color}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer info */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {filtered.length} of {payments.length} transactions
        </p>
      )}

      {/* Receipt Side Panel — Overlay */}
      {selectedPayment && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeReceipt}
          />

          {/* Panel */}
          <div
            className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-bold text-orange-600 text-sm">Digital Receipt</span>
              </div>
              <button
                onClick={closeReceipt}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Transaction Header */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Transaction Details</h2>
                <p className="text-xs text-slate-400 mt-1">Detailed breakdown of your purchase.</p>
              </div>

              {/* Merchant */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">Campus Food Services</p>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedPayment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    {new Date(selectedPayment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-semibold text-slate-600">
                  ID: {(selectedPayment.transactionId || selectedPayment._id).substring(0, 12)}
                </span>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>
                <div className="space-y-3">
                  {selectedPayment.order?.items && selectedPayment.order.items.length > 0 ? (
                    selectedPayment.order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-800 text-sm">Payment</p>
                      <p className="font-bold text-slate-900 text-sm">${selectedPayment.amount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-700">${selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service Fee</span>
                  <span className="text-slate-700">$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Paid</span>
                  <span className="text-xl font-black text-slate-900">${selectedPayment.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-600 tracking-wider uppercase">
                  {selectedPayment.method === 'PayPal' ? 'PP' : selectedPayment.method === 'QRCode' ? 'QR' : 'CARD'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase">Payment Method</p>
                  <p className="text-xs text-slate-500">{selectedPayment.method}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center">
                {(() => {
                  const s = statusConfig[selectedPayment.status] || statusConfig.Pending;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${s.bg} ${s.text}`}>
                      {s.icon}
                      {selectedPayment.status}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  closeReceipt();
                  navigate(`/payments/receipt/${selectedPayment._id}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Full Receipt
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors shadow-md shadow-orange-500/20"
              >
                <Mail className="w-4 h-4" />
                Print / Email
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
