import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi, type PaymentInitiateRequest } from '../../api/payment.api';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'PayPal' | 'QRCode'>('PayPal');
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [paypalAmount, setPaypalAmount] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setQrImage(null);
    setQrCode(null);

    const request: PaymentInitiateRequest = {
      method,
      orderId: searchParams.get('orderId') || undefined
    };

    try {
      const response = await paymentApi.initiate(request);
      setCurrentPaymentId(response.paymentId);

      if (method === 'PayPal') {
        setPaypalAmount(response.amount.toString());
      } else if (method === 'QRCode') {
        setQrCode(response.qrData);
        setQrImage(response.qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(response.qrData)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyQR = async () => {
    if (!currentPaymentId) {
      setError('Unable to verify payment. Try again.');
      return;
    }

    try {
      await paymentApi.verify(currentPaymentId, true);
      alert('QR payment completed successfully.');
      navigate('/payments/history');
    } catch (err) {
      setError('Failed to verify QR payment.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Checkout</h2>
          <p className="text-gray-500 text-center text-sm mt-2">Secure payment for your campus food order.</p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!qrImage && !paypalAmount ? (
            <>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Choose payment method</label>
                <div className="grid grid-cols-2 gap-4">
                  {['PayPal', 'QRCode'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setMethod(option as 'PayPal' | 'QRCode')}
                      className={`rounded-3xl border-2 px-4 py-4 text-sm font-semibold transition ${
                        method === option ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full rounded-3xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Preparing payment...' : `Pay with ${method}`}
              </button>
            </>
          ) : qrImage ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-64 h-64 rounded-3xl border border-gray-200 bg-gray-50 flex items-center justify-center p-4">
                <img src={qrImage} alt="QR Code" className="max-h-full max-w-full" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold">Scan this QR code</p>
                <p className="text-sm text-gray-500 mt-2">Use your mobile banking app or QR wallet to complete the payment.</p>
              </div>
              <button
                onClick={verifyQR}
                className="w-full rounded-3xl bg-green-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:bg-green-700"
              >
                Confirm payment received
              </button>
              <button
                onClick={() => { setQrImage(null); setQrCode(null); setCurrentPaymentId(null); }}
                className="w-full rounded-3xl border border-gray-200 px-5 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Start over
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Amount due</p>
                <p className="text-4xl font-bold text-gray-900">${Number(paypalAmount).toFixed(2)}</p>
              </div>
              <PayPalScriptProvider options={{ clientId: 'test', currency: 'USD', intent: 'capture' }}>
                <PayPalButtons
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [{ amount: { currency_code: 'USD', value: Number(paypalAmount).toFixed(2) } }]
                    })
                  }
                  onApprove={async (_data, actions) => {
                    if (!actions.order) return;
                    try {
                      await actions.order.capture();
                      if (currentPaymentId) {
                        await paymentApi.verify(currentPaymentId, true);
                      }
                      alert('PayPal payment completed successfully');
                      navigate('/payments/history');
                    } catch (err) {
                      setError('Payment verification failed.');
                    }
                  }}
                />
              </PayPalScriptProvider>
              <button
                onClick={() => { setPaypalAmount(null); setCurrentPaymentId(null); }}
                className="w-full rounded-3xl border border-gray-200 px-5 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel and choose another method
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
