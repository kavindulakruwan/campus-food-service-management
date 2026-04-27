import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi, type PaymentInitiateRequest } from '../../api/payment.api';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CreditCard, QrCode, Shield, ArrowLeft, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedMethod = searchParams.get('method');
  const orderId = searchParams.get('orderId') || undefined;
  const [method, setMethod] = useState<'PayPal' | 'QRCode'>(() => (
    requestedMethod === 'QRCode' ? 'QRCode' : 'PayPal'
  ));
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);
  const [paypalAmount, setPaypalAmount] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMethodLocked = requestedMethod === 'PayPal' || requestedMethod === 'QRCode';

  useEffect(() => {
    if (requestedMethod === 'QRCode') setMethod('QRCode');
    else if (requestedMethod === 'PayPal') setMethod('PayPal');
  }, [requestedMethod]);

  const handlePayment = async (selectedMethod?: 'PayPal' | 'QRCode') => {
    const payMethod = selectedMethod ?? method;
    if (!orderId) { setError('Order not found. Please place an order first.'); return; }
    setLoading(true); setError(''); setQrCode(null); setPaypalAmount(null);
    const request: PaymentInitiateRequest = { method: payMethod, orderId };
    try {
      const response = await paymentApi.initiate(request);
      if (payMethod === 'PayPal') {
        setPaypalAmount(response.amount.toString());
        setCurrentPaymentId(response.paymentId);
      } else if (payMethod === 'QRCode') {
        setQrCode(response.qrData);
        setCurrentPaymentId(response.paymentId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (requestedMethod === 'Cash') { setError('Cash payment is collected on delivery.'); return; }
    if (!isMethodLocked || !orderId || autoStarted) return;
    setAutoStarted(true);
    handlePayment(method);
  }, [autoStarted, isMethodLocked, method, orderId]);

  const verifyQR = async () => {
    if (!currentPaymentId) { setError('Unable to verify payment.'); return; }
    try {
      await paymentApi.verify(currentPaymentId, true);
      alert('QR payment completed successfully.');
      navigate('/payments');
    } catch { setError('Failed to verify QR payment.'); }
  };

  const resetFlow = () => { setPaypalAmount(null); setCurrentPaymentId(null); setQrCode(null); setError(''); };

  // QR Active Flow
  if (qrCode && !paypalAmount) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Active Payment Flow</h1>
            <p className="text-slate-500 text-sm mt-1">Keep this window open until the transaction is finalized.</p>
          </div>
          <button onClick={resetFlow} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Switch Method
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col items-center gap-6">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} alt="QR" className="w-48 h-48 rounded-xl border border-slate-200" />
            <p className="text-sm text-slate-400 text-center">Open your banking app or camera to scan and authorize payment.</p>
            <div className="flex gap-3 w-full">
              <button onClick={resetFlow} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={verifyQR} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Confirm Payment Received</button>
            </div>
          </div>
        </div>
        <div className="bg-orange-500 rounded-2xl p-4 flex items-center gap-3 text-white">
          <Clock className="w-5 h-5 opacity-80" />
          <p className="text-sm font-bold">Payment in progress — do not refresh.</p>
        </div>
      </div>
    );
  }

  // PayPal Active Flow
  if (paypalAmount && currentPaymentId) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <button onClick={resetFlow} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to payment methods
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-orange-500 px-6 py-8 text-center text-white">
            <p className="text-sm opacity-80">Amount Due</p>
            <p className="text-4xl font-black mt-1">Rs. {Number(paypalAmount).toFixed(2)}</p>
          </div>
          <div className="p-6 space-y-6">
            <PayPalScriptProvider options={{ clientId: 'test', currency: 'USD', intent: 'capture' }}>
              <PayPalButtons
                createOrder={(_data, actions) => actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [{ amount: { currency_code: 'USD', value: Number(paypalAmount).toFixed(2) } }]
                })}
                onApprove={async (_data, actions) => {
                  if (!actions.order) return;
                  try {
                    await actions.order.capture();
                    await paymentApi.verify(currentPaymentId, true);
                    alert('PayPal payment completed!');
                    navigate('/payments');
                  } catch { setError('Payment verification failed.'); }
                }}
              />
            </PayPalScriptProvider>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Secure 256-bit SSL encrypted transaction</span>
            </div>
            <button onClick={resetFlow} className="w-full text-center text-sm text-slate-500 hover:text-slate-800 font-medium">Cancel & Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Method Selection
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Make a Payment</h1>
        <p className="text-slate-500 text-sm mt-1">Select your preferred method to complete your order payment.</p>
      </div>
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">Choose Payment Method</h2>
        <div className="grid grid-cols-2 gap-4">
          {(['PayPal', 'QRCode'] as const).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all ${method === m ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
              {method === m && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${method === m ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {m === 'PayPal' ? <CreditCard className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
              </div>
              <h3 className="font-bold text-slate-800">{m === 'PayPal' ? 'PayPal Express' : 'Campus QR Code'}</h3>
              <p className="text-xs text-slate-400 mt-1">{m === 'PayPal' ? 'Fast, secure checkout via PayPal.' : 'Scan at any campus kiosk.'}</p>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => handlePayment()} disabled={loading}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-70">
        {loading ? 'Processing...' : `Pay via ${method === 'PayPal' ? 'PayPal' : 'QR Code'}`}
      </button>
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Shield className="w-4 h-4" />
        <span className="text-xs">Secure 256-bit SSL encrypted transaction</span>
      </div>
    </div>
  );
};

export default CheckoutPage;
