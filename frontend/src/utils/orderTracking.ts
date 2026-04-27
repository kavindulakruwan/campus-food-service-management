export type OrderStatus = 'Pending' | 'Processing' | 'Ready' | 'Completed' | 'Cancelled'

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface AdminOrder {
  _id: string
  orderNumber?: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  paymentMethod: 'Cash' | 'PayPal' | 'QRCode'
  createdAt: string
  userId?: string
  userName?: string
  userEmail?: string
}

export interface OrderAnalytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<OrderStatus, number>
  ordersByPaymentStatus: Record<string, number>
  todayOrders: number
  todayRevenue: number
  fulfillmentRate: number
  averageFulfillmentTime: number
}

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-700'
    case 'Processing':
      return 'bg-blue-50 text-blue-700'
    case 'Ready':
      return 'bg-indigo-50 text-indigo-700'
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'Cancelled':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-50 text-slate-600'
  }
}

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700'
    case 'Pending':
      return 'bg-amber-100 text-amber-700'
    case 'Failed':
      return 'bg-rose-100 text-rose-700'
    case 'Refunded':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const ORDER_STATUS_SEQUENCE: OrderStatus[] = ['Pending', 'Processing', 'Ready', 'Completed']

export const getNextOrderStatus = (current: OrderStatus): OrderStatus | null => {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current)
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_SEQUENCE.length - 1) return null
  return ORDER_STATUS_SEQUENCE[currentIndex + 1]
}

export const getPreviousOrderStatus = (current: OrderStatus): OrderStatus | null => {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current)
  if (currentIndex <= 0) return null
  return ORDER_STATUS_SEQUENCE[currentIndex - 1]
}

export const calculateOrderAnalytics = (orders: AdminOrder[]): OrderAnalytics => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    orderDate.setHours(0, 0, 0, 0)
    return orderDate.getTime() === today.getTime()
  })

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const todayRevenue = todayOrders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const ordersByStatus: Record<OrderStatus, number> = {
    Pending: 0,
    Processing: 0,
    Ready: 0,
    Completed: 0,
    Cancelled: 0,
  }

  orders.forEach((order) => {
    ordersByStatus[order.status]++
  })

  const ordersByPaymentStatus: Record<string, number> = {
    Paid: 0,
    Pending: 0,
    Failed: 0,
    Refunded: 0,
  }

  orders.forEach((order) => {
    ordersByPaymentStatus[order.paymentStatus]++
  })

  const completedOrders = orders.filter((o) => o.status === 'Completed')
  const fulfillmentRate =
    orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0

  return {
    totalOrders: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageOrderValue:
      orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
    ordersByStatus,
    ordersByPaymentStatus,
    todayOrders: todayOrders.length,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    fulfillmentRate,
    averageFulfillmentTime: 0,
  }
}

export const formatOrderDate = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatOrderTime = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export const getStatusSequenceProgress = (status: OrderStatus): number => {
  const index = ORDER_STATUS_SEQUENCE.indexOf(status)
  return index === -1 ? 0 : ((index + 1) / ORDER_STATUS_SEQUENCE.length) * 100
}
