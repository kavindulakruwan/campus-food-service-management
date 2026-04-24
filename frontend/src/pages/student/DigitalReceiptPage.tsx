import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';

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
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!receiptData) {
    return <div className="text-center py-10 text-red-500">Receipt not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
        {/* Receipt Header */}
        <div className="bg-blue-600 px-8 py-10 text-white text-center">
          <h2 className="text-3xl font-bold tracking-wider">{documentTitle}</h2>
          <p className="opacity-80 mt-2 text-sm">Transaction # {receiptData.transactionId || receiptData._id}</p>
        </div>

        {/* Receipt Body */}
        <div className="px-8 py-8 space-y-6">
          <div className="flex justify-between border-b pb-4 border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Date</p>
              <p className="text-gray-800 font-medium">{new Date(receiptData.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                receiptData.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                receiptData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {receiptData.status}
              </span>
            </div>
          </div>

          <div className="flex justify-between border-b pb-4 border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Student</p>
              <p className="text-gray-800 font-medium">{receiptData.user?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{receiptData.user?.email || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold uppercase">Payment Method</p>
              <p className="text-gray-800 font-medium">{receiptData.method}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase mb-3">Order Details</p>
            <div className="bg-gray-50 rounded-lg p-4">
              {receiptData.order?.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm py-2">
                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                  <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4">
            <p className="text-lg font-bold text-gray-800">{isPendingInvoice ? 'Total Due' : 'Total Paid'}</p>
            <p className="text-2xl font-bold text-blue-600">${receiptData.amount.toFixed(2)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between print:hidden">
          <button 
            onClick={() => navigate('/payments')}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2 transition-colors"
          >
            ← Back to History
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-sm"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalReceipt;
