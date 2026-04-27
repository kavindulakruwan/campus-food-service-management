import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';
import {
  Receipt,
  Download,
  Mail,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Share2,
  Printer,
} from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Payment Completed' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-4 h-4" />, label: 'Payment Pending' },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Payment Failed' },
  Refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <AlertCircle className="w-4 h-4" />, label: 'Payment Refunded' },
};

const DigitalReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isPendingInvoice = receiptData?.status === 'Pending';
  const documentTitle = isPendingInvoice ? 'INVOICE' : 'RECEIPT';

  useEffect(() => {
    if (id) {
      paymentApi.getReceipt(id)
        .then(res => setReceiptData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading receipt...</p>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Receipt not found</p>
          <p className="text-sm text-slate-400 mt-1">This receipt may have been removed or the link is invalid.</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payment History
        </button>
      </div>
    );
  }

  const date = new Date(receiptData.createdAt);
  const status = statusConfig[receiptData.status] || statusConfig.Pending;
  const items = receiptData.order?.items || [];
  const subtotal = items.length > 0
    ? items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    : receiptData.amount;

  return (
    <div className="max-w-2xl mx-auto space-y-6 print:max-w-none print:space-y-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/payments')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payment History
      </button>

      {/* Receipt Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0">

        {/* Receipt Header */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 text-center border-b border-dashed border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full mb-4">
            <Receipt className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">Digital Receipt</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Transaction Details</h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed breakdown of your purchase at Campus Food Services.
          </p>
        </div>

        {/* Merchant Info */}
        <div className="px-6 sm:px-8 py-6 text-center border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {receiptData.user?.name ? `${receiptData.user.name}'s Purchase` : 'Campus Food Services'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="inline-flex items-center mt-3 px-3 py-1 bg-slate-100 rounded-full">
            <span className="text-xs font-mono font-semibold text-slate-600">
              ID: {receiptData.transactionId || receiptData._id}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Payment</p>
                <p className="text-xs text-slate-400">Single transaction</p>
              </div>
              <p className="font-bold text-slate-900">${receiptData.amount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Totals Breakdown */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Sales Tax (8.0%)</span>
            <span className="font-medium text-slate-700">${(subtotal * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Campus Student Discount</span>
            <span className="font-medium text-emerald-600">-$0.00</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-lg font-bold text-slate-900">Total Paid</span>
            <span className="text-2xl font-black text-slate-900">${receiptData.amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                {receiptData.method === 'PayPal' ? 'PP' : receiptData.method === 'QRCode' ? 'QR' : 'VISA'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</p>
              <p className="text-sm text-slate-500">{receiptData.method}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {/* Student Info */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student</p>
              <p className="font-semibold text-slate-800 mt-1">{receiptData.user?.name || 'N/A'}</p>
              <p className="text-sm text-slate-400">{receiptData.user?.email || 'N/A'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold">
              {receiptData.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Digital Receipt',
                  text: `Receipt for $${receiptData.amount.toFixed(2)} - ${receiptData.transactionId || receiptData._id}`,
                }).catch(() => {});
              } else {
                window.print();
              }
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors shadow-md shadow-orange-500/20"
          >
            <Mail className="w-4 h-4" />
            Email Copy
          </button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-400 print:hidden">
        <button onClick={() => window.print()} className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
          <Printer className="w-3 h-3" />
          Print
        </button>
        <span>·</span>
        <button className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          Share
        </button>
        <span>·</span>
        <button onClick={() => navigate('/payments')} className="hover:text-slate-600 transition-colors">
          Back to History
        </button>
      </div>
    </div>
  );
};

export default DigitalReceipt;
