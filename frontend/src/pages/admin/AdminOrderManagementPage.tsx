import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Clock, Filter, Search, TrendingUp, Zap } from 'lucide-react'
import { orderApi } from '../../api/order.api'
import {
  calculateOrderAnalytics,
  formatOrderDate,
  formatOrderTime,
  getNextOrderStatus,
  getOrderStatusColor,
  getPaymentStatusColor,
  getStatusSequenceProgress,
  type AdminOrder,
  type OrderStatus,
} from '../../utils/orderTracking'

type FilterStatus = 'all' | OrderStatus

const AdminOrderManagementPage = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await orderApi.getMyOrders()
        const orderList = Array.isArray(response.data) ? response.data : []
        setOrders(orderList)
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || 'Failed to load orders.')
      } finally {
        setLoading(false)
      }
    }

    void loadOrders()
  }, [])

  const analytics = useMemo(() => calculateOrderAnalytics(orders), [orders])

  const getDateRangeFilter = (date: string): boolean => {
    const orderDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dateRange === 'today') return daysDiff === 0
    if (dateRange === 'week') return daysDiff >= 0 && daysDiff <= 7
    if (dateRange === 'month') return daysDiff >= 0 && daysDiff <= 30
    return true
  }

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (filterStatus !== 'all' && order.status !== filterStatus) return false
        if (filterPaymentStatus !== 'all' && order.paymentStatus !== filterPaymentStatus) return false
        if (!getDateRangeFilter(order.createdAt)) return false

        const searchLower = search.toLowerCase()
        if (search.trim()) {
          return (
            (order.orderNumber || '').toLowerCase().includes(searchLower) ||
            (order._id || '').toLowerCase().includes(searchLower) ||
            (order.userName || '').toLowerCase().includes(searchLower) ||
            (order.userEmail || '').toLowerCase().includes(searchLower)
          )
        }

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, filterStatus, filterPaymentStatus, dateRange, search])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o._id === orderId)
    if (!order) return

    try {
      const updatedOrder = { ...order, status: newStatus }
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
      )
      setMessage(`Order updated to ${newStatus}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (updateError: any) {
      setError(updateError?.response?.data?.message || 'Failed to update order.')
      setOrders((prev) => prev)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange-200 border-t-orange-500" />
        <p className="text-sm font-medium text-slate-400">Loading orders...</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Order Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">All student orders</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Track order statuses, manage fulfillment queue, and monitor payment status in real-time.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.totalOrders}</p>
          <p className="mt-1 text-xs text-slate-500">Today: {analytics.todayOrders}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">${analytics.totalRevenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">Today: ${analytics.todayRevenue.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Order Value</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">${analytics.averageOrderValue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">{analytics.ordersByStatus.Completed} completed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fulfillment Rate</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{analytics.fulfillmentRate}%</p>
          <p className="mt-1 text-xs text-slate-500">{analytics.ordersByStatus.Pending} pending</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['Pending', 'Processing', 'Ready', 'Completed'] as OrderStatus[]).map((status) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getOrderStatusColor(status)}`}>
              {status}
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{analytics.ordersByStatus[status]}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Filter Orders</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, student name, or email"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as typeof dateRange)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Payment Pending</option>
              <option value="Failed">Payment Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No orders found for this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const nextStatus = getNextOrderStatus(order.status)
                  const progressPercent = getStatusSequenceProgress(order.status)

                  return (
                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {order.orderNumber || order._id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-slate-900">{order.userName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{order.userEmail || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{formatOrderDate(order.createdAt)}</div>
                        <div className="text-slate-500">{formatOrderTime(order.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mb-2">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {nextStatus && order.status !== 'Cancelled' ? (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order._id, nextStatus)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                            title={`Move to ${nextStatus}`}
                          >
                            <ChevronRight className="h-3 w-3" />
                            {nextStatus}
                          </button>
                        ) : order.status === 'Completed' ? (
                          <span className="text-xs text-emerald-600 font-semibold">✓ Done</span>
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-orange-500" />
            <h3 className="text-lg font-bold text-slate-900">Order Workflow</h3>
          </div>
          <div className="space-y-3">
            {['Pending', 'Processing', 'Ready', 'Completed'].map((status, idx) => (
              <div key={status} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{status}</p>
                  <p className="text-xs text-slate-500">
                    {idx === 0 && 'Order received and payment pending'}
                    {idx === 1 && 'Kitchen is preparing the order'}
                    {idx === 2 && 'Order ready for pickup'}
                    {idx === 3 && 'Order completed and picked up'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900">Quick Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Completed Today</span>
              <span className="text-lg font-bold text-slate-900">
                {orders.filter((o) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const orderDate = new Date(o.createdAt)
                  orderDate.setHours(0, 0, 0, 0)
                  return orderDate.getTime() === today.getTime() && o.status === 'Completed'
                }).length}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Pending Payment</span>
              <span className="text-lg font-bold text-amber-600">
                {orders.filter((o) => o.paymentStatus === 'Pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">In Kitchen</span>
              <span className="text-lg font-bold text-blue-600">
                {orders.filter((o) => o.status === 'Processing').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Ready for Pickup</span>
              <span className="text-lg font-bold text-indigo-600">
                {orders.filter((o) => o.status === 'Ready').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminOrderManagementPage
