import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<'PayPal' | 'QRCode'>('PayPal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrImage, setQrImage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

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
        setSuccess('Scan the QR code to complete payment');
      } else if (method === 'PayPal' && res.approvalUrl) {
        setSuccess('Redirecting to PayPal...');
        setTimeout(() => { window.location.href = res.approvalUrl; }, 1000);
      } else {
        setSuccess('Payment initiated successfully');
      }
      // Refresh history
      const hist: any = await paymentApi.getHistory();
      setPayments(hist.data ?? hist ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-600">Payments</p>
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">{error}<button onClick={() => setError('')} className="font-bold ml-4">×</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex justify-between">{success}<button onClick={() => setSuccess('')} className="font-bold ml-4">×</button></div>}

      {/* Payment Form - show only if orderId in URL */}
      {orderId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 max-w-md">
          <h2 className="font-semibold text-gray-900 text-lg">Complete Payment</h2>
          <div className="rounded-xl bg-gray-50 p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">Order Amount</span>
            <span className="text-xl font-bold text-gray-900">Rs. {Number(amount).toFixed(2)}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {(['PayPal', 'QRCode'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${method === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {m === 'PayPal' ? '💳 PayPal' : '📱 QR Code'}
                </button>
              ))}
            </div>
          </div>
          {qrImage && (
            <div className="text-center space-y-2">
              <img src={qrImage} alt="Payment QR" className="mx-auto w-48 h-48 rounded-lg border border-gray-200" />
              <p className="text-xs text-gray-500">Scan to complete payment</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate('/orders')} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Back to Orders</button>
            <button onClick={handlePay} disabled={paying}
              className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 disabled:opacity-50">
              {paying ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
          <button onClick={() => navigate('/orders')} className="text-sm text-orange-600 hover:text-orange-700 font-medium">← Back to Orders</button>
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
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.transactionId ?? p._id.slice(-8)}</td>
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
