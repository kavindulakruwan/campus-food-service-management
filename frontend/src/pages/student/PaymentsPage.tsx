import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<'PayPal' | 'QRCode'>('QRCode');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [paid, setPaid] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const hasNewOrder = !!orderId && !!amount;

  useEffect(() => {
    paymentApi.getHistory()
      .then((res: any) => setPayments(res.data ?? res ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    if (!orderId) { setError('No order selected'); return; }
    setPaying(true); setError(''); setQrImage('');
    try {
      const res: any = await paymentApi.initiate({ orderId, method });
      if (method === 'QRCode' && res.qrImage) {
        setQrImage(res.qrImage);
        setSuccess('Scan the QR code below to complete your payment');
      } else if (method === 'PayPal' && res.approvalUrl) {
        setSuccess('Redirecting to PayPal...');
        setTimeout(() => { window.location.href = res.approvalUrl; }, 1200);
      } else {
        setSuccess('Payment initiated!');
      }
      const hist: any = await paymentApi.getHistory();
      setPayments(hist.data ?? hist ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed. Please try again.');
    } finally { setPaying(false); }
  };

  const handleConfirmPaid = async (paymentId: string) => {
    try {
      await paymentApi.verify(paymentId, true);
      setPaid(true);
      setSuccess('Payment confirmed! Your order is being processed.');
      setQrImage('');
      const hist: any = await paymentApi.getHistory();
      setPayments(hist.data ?? hist ?? []);
    } catch { setError('Failed to confirm payment'); }
  };

  const latestPayment = payments[0];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-600">Payments</p>
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">{error}<button onClick={() => setError('')} className="font-bold ml-4">×</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex justify-between">{success}<button onClick={() => setSuccess('')} className="font-bold ml-4">×</button></div>}

      {hasNewOrder && !paid && (
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl">🛒</div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Complete Your Payment</h2>
              <p className="text-sm text-gray-500">Your order has been placed. Please pay to confirm.</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-orange-100 p-4 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Order Total</span>
            <span className="text-2xl font-bold text-orange-600">Rs. {Number(amount).toFixed(2)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Choose Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMethod('QRCode')}
                className={`py-4 rounded-xl border-2 text-sm font-semibold transition flex flex-col items-center gap-1 ${method === 'QRCode' ? 'border-orange-500 bg-white text-orange-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                <span className="text-2xl">📱</span>QR Code
              </button>
              <button onClick={() => setMethod('PayPal')}
                className={`py-4 rounded-xl border-2 text-sm font-semibold transition flex flex-col items-center gap-1 ${method === 'PayPal' ? 'border-orange-500 bg-white text-orange-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                <span className="text-2xl">💳</span>PayPal
              </button>
            </div>
          </div>
          {qrImage && (
            <div className="rounded-xl bg-white border border-gray-200 p-6 text-center space-y-3">
              <p className="text-sm font-medium text-gray-700">Scan to Pay</p>
              <img src={qrImage} alt="Payment QR" className="mx-auto w-48 h-48 rounded-lg" />
              <p className="text-xs text-gray-400">Use any UPI or payment app to scan</p>
              <button onClick={() => handleConfirmPaid(latestPayment?._id)}
                className="mt-2 px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                I've Paid ✓
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate('/orders')} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 font-medium">← Back to Orders</button>
            {!qrImage && (
              <button onClick={handlePay} disabled={paying}
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 disabled:opacity-50">
                {paying ? 'Processing...' : `Pay Rs. ${Number(amount).toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      )}

      {paid && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-green-800">Payment Successful!</h2>
          <p className="text-sm text-green-600">Your order is now being processed.</p>
          <button onClick={() => navigate('/orders')} className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">View Orders</button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
          {!hasNewOrder && <button onClick={() => navigate('/orders')} className="text-sm text-orange-600 hover:text-orange-700 font-medium">← Back to Orders</button>}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No payment history yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>{['Date', 'Transaction ID', 'Method', 'Amount', 'Status', 'Action'].map(h =>
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.transactionId ?? p._id?.slice(-8)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-gray-100 text-xs">{p.method}</span></td>
                    <td className="px-4 py-3 font-semibold">Rs. {Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        p.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        p.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/payments/receipt/${p._id}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">Receipt →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
