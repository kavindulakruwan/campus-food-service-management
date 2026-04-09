import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../api/payment.api';

interface PaymentUser {
  _id: string;
  name: string;
  email: string;
}

interface Payment {
  _id: string;
  user: PaymentUser;
  order: string;
  amount: number;
  method: 'PayPal' | 'QRCode' | 'CreditCard';
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  receiptUrl?: string;
  receiptSent: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminPaymentDashboard: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchPayments = () => {
    paymentApi.getAllPayments()
      .then((res: { data: Payment[] }) => setPayments(res.data || []))
      .catch((err: unknown) => {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } };
          console.error(e.response?.data?.message || 'Failed to fetch payments');
        } else {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (id: string) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;
    
    setRefundingId(id);
    try {
      await paymentApi.refundPayment(id);
      fetchPayments(); // Refresh list
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } };
        alert(e.response?.data?.message || 'Failed to refund payment');
      } else {
        alert('Failed to refund payment');
      }
    } finally {
      setRefundingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all system transactions and issue refunds.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments found in the system.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[120px]">
                      {payment.transactionId || payment._id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{payment.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.user?.email}</div>
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
                        onClick={() => handleRefund(payment._id)}
                        disabled={refundingId === payment._id || payment.status !== 'Completed'}
                        className={`font-medium text-sm transition-colors py-1.5 px-4 border rounded-lg whitespace-nowrap ${
                          payment.status === 'Completed'
                            ? 'text-red-600 hover:text-red-800 border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer shadow-sm'
                            : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {refundingId === payment._id ? 'Refunding...' : payment.status === 'Refunded' ? 'Already Refunded' : 'Issue Refund'}
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

export default AdminPaymentDashboard;
