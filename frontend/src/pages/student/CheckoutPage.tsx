import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi, type PaymentInitiateRequest } from '../../api/payment.api';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  CreditCard,
  QrCode,
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

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
  // States for real PayPal flow
  const [paypalAmount, setPaypalAmount] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const navigate = useNavigate();
  const isMethodLocked = requestedMethod === 'PayPal' || requestedMethod === 'QRCode';

  useEffect(() => {
    if (requestedMethod === 'QRCode') {
      setMethod('QRCode');
    } else if (requestedMethod === 'PayPal') {
      setMethod('PayPal');
    }
  }, [requestedMethod]);

  const handlePayment = async (selectedMethod: 'PayPal' | 'QRCode') => {
    if (!orderId) {
      setError('Order not found. Please place an order first.');
      return;
    }

    setLoading(true);
    setError('');
    setQrCode(null);
    setPaypalAmount(null);

    const request: PaymentInitiateRequest = {
      method: selectedMethod,
      orderId,
    };

    try {
      const response = await paymentApi.initiate(request);
      if (selectedMethod === 'PayPal') {
        setPaypalAmount(response.amount.toString());
        setCurrentPaymentId(response.paymentId);
      } else if (selectedMethod === 'QRCode') {
        setQrCode(response.qrData);
        setCurrentPaymentId(response.paymentId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestedMethod === 'Cash') {
      setError('Cash payment is collected on delivery. No online gateway is required.');
      return;
    }

    if (!isMethodLocked || !orderId || autoStarted) {
      return;
    }

    setAutoStarted(true);
    handlePayment(method);
  }, [autoStarted, isMethodLocked, method, orderId]);

  const verifyQR = async () => {
    alert('QR Code Scanned and Payment Processed (Simulated)');
    navigate('/payments/history');
  };

  const resetFlow = () => {
    setPaypalAmount(null);
    setCurrentPaymentId(null);
    setQrCode(null);
    setError('');
  };

  // ─── QR Code Active Flow ───
  if (qrCode && !paypalAmount) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Active Payment Flow</h1>
            <p className="text-slate-500 text-sm mt-1">Keep this window open until the transaction is finalized.</p>
          </div>
          <button
            onClick={resetFlow}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Switch Method
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            {['Authorization', 'Processing', 'Completion'].map((step, idx) => (
              <div key={step} className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  idx === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block ${
                  idx === 0 ? 'text-orange-600' : 'text-slate-400'
                }`}>{step}</span>
                {idx < 2 && <div className="flex-1 h-px bg-slate-200 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* QR Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Authorize Transaction</h2>
              <p className="text-sm text-slate-400 mt-0.5">Using QR Payment Method</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">Direct Scan</span>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="w-48 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
              <div className="w-36 h-36 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example')] bg-cover bg-center rounded-lg opacity-80" />
            </div>

            <p className="text-sm text-slate-400 text-center max-w-xs">
              Open your preferred banking app or camera to scan this code and authorize the payment.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 rounded-xl p-4 w-full">
              <div className="flex items-center gap-3 flex-1">
                <Shield className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase">Security Check</p>
                  <p className="text-xs text-slate-400">End-to-End Encrypted</p>
                </div>
              </div>
              <button
                onClick={verifyQR}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                I have scanned the code
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-orange-500 rounded-2xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 opacity-80" />
            <div>
              <p className="text-sm font-bold">Payment in progress</p>
              <p className="text-xs opacity-80">Do not refresh your browser during this time.</p>
            </div>
          </div>
          <button
            onClick={resetFlow}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── PayPal Active Flow ───
  if (paypalAmount && currentPaymentId) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <button onClick={resetFlow} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to payment methods
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-center text-white">
            <p className="text-sm opacity-80 font-medium">Amount Due</p>
            <p className="text-4xl font-black mt-1">${Number(paypalAmount).toFixed(2)}</p>
          </div>

          <div className="p-6 space-y-6">
            <PayPalScriptProvider options={{ clientId: "test", currency: "USD", intent: "capture" }}>
              <PayPalButtons
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{ amount: { currency_code: "USD", value: Number(paypalAmount).toFixed(2) } }]
                  });
                }}
                onApprove={async (data, actions) => {
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

            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Secure 256-bit SSL encrypted transaction</span>
            </div>

            <button
              onClick={resetFlow}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel & Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Default: Payment Method Selection ───
  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Make a Payment</h1>
        <p className="text-slate-500 text-sm mt-1">Select your preferred method to complete your order payment.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold">!</span>
          {error}
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</div>
          <h2 className="text-lg font-bold text-slate-900">Choose Payment Method</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMethod('PayPal')}
            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              method === 'PayPal'
                ? 'border-orange-500 bg-orange-50/60 shadow-md shadow-orange-500/10'
                : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm'
            }`}
          >
            {method === 'PayPal' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
              method === 'PayPal' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">PayPal Express</h3>
            <p className="text-xs text-slate-400 mt-1">Fast, secure checkout using your PayPal balance or linked cards.</p>
          </button>

          <button
            onClick={() => setMethod('QRCode')}
            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              method === 'QRCode'
                ? 'border-orange-500 bg-orange-50/60 shadow-md shadow-orange-500/10'
                : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm'
            }`}
          >
            {method === 'QRCode' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
              method === 'QRCode' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">Campus QR Code</h3>
            <p className="text-xs text-slate-400 mt-1">Scan at any campus kiosk or register for instant touchless payment.</p>
          </button>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Pay via ${method === 'PayPal' ? 'PayPal' : 'QR Code'}`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Shield className="w-4 h-4" />
        <span className="text-xs font-medium">Secure 256-bit SSL encrypted transaction</span>
      </div>
    </div>
  );
};

export default CheckoutPage;
