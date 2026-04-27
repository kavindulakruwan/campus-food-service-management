import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

const receiptStyleByStatus: Record<string, { documentType: string; heading: string; subtitle: string; totalLabel: string; panel: string }> = {
  Completed: {
    documentType: 'RECEIPT',
    heading: 'Payment Receipt',
    subtitle: 'Payment completed successfully.',
    totalLabel: 'Total Paid',
    panel: 'border-emerald-100 bg-emerald-50/70 text-emerald-800',
  },
  Pending: {
    documentType: 'INVOICE',
    heading: 'Pending Payment Invoice',
    subtitle: 'Payment is not completed yet. Amount remains due.',
    totalLabel: 'Total Due',
    panel: 'border-amber-100 bg-amber-50/70 text-amber-800',
  },
  Failed: {
    documentType: 'ATTEMPT SLIP',
    heading: 'Failed Payment Attempt',
    subtitle: 'This payment attempt failed. You can retry payment from history.',
    totalLabel: 'Amount Attempted',
    panel: 'border-red-100 bg-red-50/70 text-red-800',
  },
  Refunded: {
    documentType: 'REFUND RECEIPT',
    heading: 'Refund Receipt',
    subtitle: 'Payment was refunded successfully.',
    totalLabel: 'Refunded Amount',
    panel: 'border-slate-200 bg-slate-100/70 text-slate-700',
  },
};

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Payment Completed' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-4 h-4" />, label: 'Payment Pending' },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Payment Failed' },
  Refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <AlertCircle className="w-4 h-4" />, label: 'Payment Refunded' },
};

const DigitalReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stateReceipt = (location.state as { receiptData?: any } | null)?.receiptData;
    if (stateReceipt) {
      setReceiptData(stateReceipt);
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    paymentApi
      .getReceipt(id)
      .then((res) => setReceiptData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange-200 border-t-orange-500" />
        <p className="text-sm font-medium text-slate-400">Loading receipt...</p>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Receipt not found</p>
          <p className="mt-1 text-sm text-slate-400">This receipt may have been removed or the link is invalid.</p>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 transition-colors hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payment History
        </button>
      </div>
    );
  }

  const statusKey = receiptData.status || 'Pending';
  const status = statusConfig[statusKey] || statusConfig.Pending;
  const style = receiptStyleByStatus[statusKey] || receiptStyleByStatus.Pending;

  const date = new Date(receiptData.createdAt);
  const items = receiptData.order?.items || [];
  const subtotal = items.length > 0
    ? items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    : Number(receiptData.amount || 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 print:max-w-none print:space-y-4">
      <button
        onClick={() => navigate('/payments')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payment History
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm print:border-0 print:shadow-none">
        <div className="border-b border-dashed border-slate-200 px-6 pb-6 pt-6 text-center sm:px-8 sm:pt-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5">
            <Receipt className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">{style.documentType}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{style.heading}</h1>
          <p className="mt-1 text-sm text-slate-400">{style.subtitle}</p>
        </div>

        <div className="border-b border-slate-100 px-6 py-6 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {receiptData.user?.name ? `${receiptData.user.name}'s Purchase` : 'Campus Food Services'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
            <span className="text-xs font-mono font-semibold text-slate-600">ID: {receiptData.transactionId || receiptData._id}</span>
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Order Summary</h3>

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
              <p className="font-bold text-slate-900">${Number(receiptData.amount || 0).toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 border-b border-slate-100 px-6 py-6 sm:px-8">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-lg font-bold text-slate-900">{style.totalLabel}</span>
            <span className="text-2xl font-black text-slate-900">${Number(receiptData.amount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                {receiptData.method === 'PayPal' ? 'PP' : receiptData.method === 'QRCode' ? 'QR' : 'VISA'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Payment Method</p>
              <p className="text-sm text-slate-500">{receiptData.method}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Status</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${status.bg} ${status.text}`}>
              {status.icon}
              {status.label}
            </span>
          </div>

          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${style.panel}`}>
            {style.subtitle}
          </div>
        </div>

        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Student</p>
              <p className="mt-1 font-semibold text-slate-800">{receiptData.user?.name || 'N/A'}</p>
              <p className="text-sm text-slate-400">{receiptData.user?.email || 'N/A'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 font-extrabold text-orange-600">
              {receiptData.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:px-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Download {style.documentType}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: style.heading,
                    text: `${style.documentType} for $${Number(receiptData.amount || 0).toFixed(2)} - ${receiptData.transactionId || receiptData._id}`,
                  })
                  .catch(() => {});
              } else {
                window.print();
              }
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-orange-600"
          >
            <Mail className="h-4 w-4" />
            Share Copy
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-slate-400 print:hidden">
        <button onClick={() => window.print()} className="inline-flex items-center gap-1 transition-colors hover:text-slate-600">
          <Printer className="h-3 w-3" />
          Print
        </button>
        <span>·</span>
        <button className="inline-flex items-center gap-1 transition-colors hover:text-slate-600">
          <Share2 className="h-3 w-3" />
          Share
        </button>
        <span>·</span>
        <button onClick={() => navigate('/payments')} className="transition-colors hover:text-slate-600">
          Back to History
        </button>
      </div>
    </div>
  );
};

export default DigitalReceipt;
