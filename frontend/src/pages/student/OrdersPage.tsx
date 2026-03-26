import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      await orderApi.createOrder();
      const res = await orderApi.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    orderApi.getMyOrders()
      .then(res => setOrders(res.data || []))
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
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">Track your campus food orders and pending payments.</p>
        </div>
        <button 
          onClick={handleCreateOrder}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-75 flex items-center justify-center min-w-[140px]"
        >
          {creating ? 'Creating...' : '+ Quick Order'}
        </button>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No recent orders found in the database.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row justify-between items-center p-6">
              
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400 font-mono">{order.orderNumber || order._id.substring(0,8)}</span>
                  <span className="text-sm font-medium text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus === 'Paid' ? 'Payment Verified' : 'Awaiting Payment'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'No Items'}
                  </h3>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    ${order.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0 w-full md:w-auto">
                {order.paymentStatus === 'Pending' ? (
                  <button 
                    onClick={() => navigate(`/checkout?orderId=${order._id}`)}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Pay Now →
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/payments/history')}
                    className="w-full md:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-xl transition-colors"
                  >
                    View History
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
