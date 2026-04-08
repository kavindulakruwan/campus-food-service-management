import { useEffect, useState } from 'react'
import {
  getAdminDashboard,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  toggleUserActive,
  type AdminDashboardData,
  type FullOrder,
  type FullUser,
} from '../../api/admin.api'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'orders' | 'users'

const STATUS_OPTIONS = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ready:     'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-500',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent: string }) => (
  <article className={`rounded-2xl border p-5 flex items-center gap-4 ${accent}`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </article>
)

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const MiniBarChart = ({ data }: { data: { _id: string; count: number; revenue: number }[] }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => (
        <div key={d._id} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t bg-orange-400 transition-all"
            style={{ height: `${(d.count / maxCount) * 64}px`, minHeight: '4px' }}
            title={`${d._id}: ${d.count} orders`}
          />
          <span className="text-[9px] text-slate-400 rotate-45 origin-left whitespace-nowrap">
            {d._id.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Donut-style status breakdown ────────────────────────────────────────────
const StatusBreakdown = ({ breakdown }: { breakdown: Record<string, number> }) => {
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0) || 1
  return (
    <div className="space-y-2">
      {STATUS_OPTIONS.filter((s) => breakdown[s]).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s]}`}>
            {s}
          </span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400"
              style={{ width: `${((breakdown[s] ?? 0) / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 w-6 text-right">{breakdown[s] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminHomePage = () => {
  const [tab, setTab] = useState<Tab>('overview')
  const [dash, setDash] = useState<AdminDashboardData | null>(null)
  const [orders, setOrders] = useState<FullOrder[]>([])
  const [orderTotal, setOrderTotal] = useState(0)
  const [orderFilter, setOrderFilter] = useState('')
  const [users, setUsers] = useState<FullUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Load dashboard overview ──────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    getAdminDashboard()
      .then((r) => setDash(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  // ── Load orders when tab active ──────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'orders') return
    getAdminOrders({ status: orderFilter || undefined }).then((r) => {
      setOrders(r.data.data)
      setOrderTotal(r.data.total)
    })
  }, [tab, orderFilter])

  // ── Load users when tab active ───────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'users') return
    getAdminUsers().then((r) => {
      setUsers(r.data.data)
      setUserTotal(r.data.total)
    })
  }, [tab])

  // ── Update order status ──────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o))
  }

  // ── Toggle user active ───────────────────────────────────────────────────
  const handleToggleUser = async (id: string) => {
    await toggleUserActive(id)
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u))
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'orders',   label: 'Orders',   icon: '🧾' },
    { key: 'users',    label: 'Users',    icon: '👥' },
  ]

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-600">Admin Space</p>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {/* ── Overview Tab ── */}
      {tab === 'overview' && !loading && dash && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Users"    value={dash.totals.users}         icon="👤" accent="border-slate-200 bg-white" />
            <StatCard label="Students"       value={dash.totals.students}      icon="🎓" accent="border-blue-100 bg-blue-50" />
            <StatCard label="Admins"         value={dash.totals.admins}        icon="🛡️" accent="border-purple-100 bg-purple-50" />
            <StatCard label="Total Orders"   value={dash.totals.totalOrders}   icon="🧾" accent="border-orange-100 bg-orange-50" />
            <StatCard label="Pending Orders" value={dash.totals.pendingOrders} icon="⏳" accent="border-yellow-100 bg-yellow-50" />
            <StatCard label="Revenue (Rs.)"  value={`Rs. ${dash.totals.totalRevenue.toLocaleString()}`} icon="💰" accent="border-green-100 bg-green-50" />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily orders bar chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Orders — Last 7 Days</h2>
              {dash.dailyOrders.length === 0
                ? <p className="text-xs text-slate-400">No order data yet</p>
                : <MiniBarChart data={dash.dailyOrders} />
              }
            </div>

            {/* Status breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Order Status Breakdown</h2>
              {Object.keys(dash.statusBreakdown).length === 0
                ? <p className="text-xs text-slate-400">No orders yet</p>
                : <StatusBreakdown breakdown={dash.statusBreakdown} />
              }
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                    <th className="pb-2 pr-4">Order ID</th>
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Items</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 text-slate-700">
                      <td className="py-2 pr-4 font-mono text-xs text-slate-400">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="py-2 pr-4">{o.student?.name ?? '—'}</td>
                      <td className="py-2 pr-4">{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</td>
                      <td className="py-2 pr-4 font-medium text-orange-600">Rs. {o.total}</td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent Registrations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 text-slate-700">
                      <td className="py-2 pr-4 font-medium">{u.name}</td>
                      <td className="py-2 pr-4 text-slate-500">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Filter:</span>
            {['', ...STATUS_OPTIONS].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setOrderFilter(s)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  orderFilter === s ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s || 'All'} {s && `(${orders.filter((o) => o.status === s).length})`}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">{orderTotal} total</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">No orders found</td></tr>
                  )}
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">#{o._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{o.student?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{o.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px]">
                        {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-orange-600">Rs. {o.total}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 italic">{o.note || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          className={`rounded-lg border-0 px-2 py-1 text-xs font-medium outline-none cursor-pointer ${STATUS_COLORS[o.status]}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{userTotal} registered users</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">No users found</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleUser(u._id)}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                            u.isActive
                              ? 'bg-red-50 text-red-500 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminHomePage
