import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payment.api';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    paymentApi.getHistory()
      .then(res => setPayments(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 mt-1">View your past transactions and receipts.</p>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
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
