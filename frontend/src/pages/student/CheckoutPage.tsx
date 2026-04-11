import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi, type PaymentInitiateRequest } from '../../api/payment.api';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'PayPal' | 'QRCode'>(() => (
    searchParams.get('method') === 'QRCode' ? 'QRCode' : 'PayPal'
  ));
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // States for real PayPal flow
  const [paypalAmount, setPaypalAmount] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const requestedMethod = searchParams.get('method');

    if (requestedMethod === 'QRCode') {
      setMethod('QRCode');
    } else if (requestedMethod === 'PayPal') {
      setMethod('PayPal');
    }
  }, [searchParams]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    const request: PaymentInitiateRequest = {
      method,
      orderId: searchParams.get('orderId') || undefined
    };

    try {
      const response = await paymentApi.initiate(request);
      if (method === 'PayPal') {
        setPaypalAmount(response.amount.toString());
        setCurrentPaymentId(response.paymentId);
      } else if (method === 'QRCode') {
        setQrCode(response.qrData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyQR = async () => {
    alert('QR Code Scanned and Payment Processed (Simulated)');
    navigate('/payments/history');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Checkout</h2>
          <p className="text-gray-500 text-center text-sm mt-2">Complete your order payment</p>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {!qrCode && !paypalAmount ? (
            <>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMethod('PayPal')}
                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      method === 'PayPal' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-blue-300 text-gray-600'
                    }`}
                  >
                    <span className="font-semibold tracking-wide">PayPal</span>
                  </button>
                  <button
                    onClick={() => setMethod('QRCode')}
                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      method === 'QRCode' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-blue-300 text-gray-600'
                    }`}
                  >
                    <span className="font-semibold tracking-wide">QR Code</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Pay via ${method}`}
                </button>
              </div>
            </>
          ) : qrCode && !paypalAmount ? (
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="w-32 h-32 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example')] bg-cover opacity-80 mix-blend-multiply"></div>
              </div>
              <div>
                <p className="text-gray-800 font-semibold mb-1">Scan to Pay</p>
                <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded truncate">{qrCode}</p>
              </div>
              <button
                onClick={verifyQR}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
              >
                I have scanned the code
              </button>
            </div>
          ) : paypalAmount && currentPaymentId && (
            <div className="space-y-6 animate-fade-in-up">
               <div className="text-center">
                 <p className="text-gray-500 text-sm">Amount Due</p>
                 <p className="text-3xl font-bold text-gray-900">${Number(paypalAmount).toFixed(2)}</p>
               </div>
               <PayPalScriptProvider options={{ clientId: "test", currency: "USD", intent: "capture" }}>
                 <PayPalButtons 
                     createOrder={(_data, actions) => {
                      return actions.order.create({
                         intent: "CAPTURE",
                         purchase_units: [{ amount: { currency_code: "USD", value: Number(paypalAmount).toFixed(2) } }]
                      });
                    }}
                    onApprove={async (_data, actions) => {
                      if (actions.order) {
                        try {
                          await actions.order.capture();
                          await paymentApi.verify(currentPaymentId, true);
                          alert('PayPal Transaction Successful!');
                          navigate('/payments/history');
                        } catch (err) {
                          alert('Payment verification failed on server.');
                        }
                      }
                    }}
                 />
               </PayPalScriptProvider>
               <button onClick={() => { setPaypalAmount(null); setCurrentPaymentId(null); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-800">
                 Cancel & Go Back
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
