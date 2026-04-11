import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId');
  const requestedMethod = searchParams.get('method');

  const paymentMethod = useMemo(() => {
    if (requestedMethod === 'QRCode') {
      return 'QRCode';
    }

    return 'PayPal';
  }, [requestedMethod]);

  useEffect(() => {
    paymentApi.getHistory()
      .then(res => setPayments(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const startPayment = async () => {
      if (!orderId) {
        return;
      }

      setInitiating(true);
      setError('');

      try {
        const response = await paymentApi.initiate({ orderId, method: paymentMethod });

        setPaymentId(response.paymentId);
        setAmount(response.amount ?? null);

        if (paymentMethod === 'QRCode') {
          setQrCode(response.qrData || null);
        } else {
          setQrCode(null);
        }
      } catch (initiationError: any) {
        console.error(initiationError);
        setError(initiationError?.response?.data?.message || 'Failed to start payment.');
      } finally {
        setInitiating(false);
      }
    };

    startPayment();
  }, [orderId, paymentMethod]);

  const handleQrSuccess = async () => {
    if (!paymentId) {
      return;
    }

    await paymentApi.verify(paymentId, true);
    navigate('/payments/history');
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
      {orderId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
            <p className="text-gray-500 mt-1">Finish the payment step for your new order.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {initiating ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paymentMethod === 'QRCode' && qrCode ? (
            <div className="space-y-4">
              <div className="grid place-items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8">
                <div className="text-center space-y-3">
                  <div className="mx-auto h-40 w-40 rounded-2xl bg-white border border-gray-200 grid place-items-center text-xs text-gray-400 font-mono px-4">
                    {qrCode}
                  </div>
                  <p className="text-sm text-gray-500">Scan the QR payload to complete the payment.</p>
                  <p className="text-lg font-bold text-gray-900">{amount !== null ? `Rs. ${amount.toFixed(2)}` : ''}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQrSuccess}
                className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                I have paid
              </button>
            </div>
          ) : paymentMethod === 'PayPal' && paymentId ? (
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-sm text-gray-500">Your PayPal payment has been created.</p>
              <p className="text-3xl font-black text-gray-900">{amount !== null ? `Rs. ${amount.toFixed(2)}` : ''}</p>
              <button
                type="button"
                onClick={() => navigate('/checkout?orderId=' + orderId + '&method=PayPal')}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Continue PayPal Payment
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 mt-1">View your past transactions and receipts.</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm"
        >
          New Payment
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
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payment history found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
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
                        payment.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/payments/receipt/${payment._id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        Receipt →
                      </button>
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
