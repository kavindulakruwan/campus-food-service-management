import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Search, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { pantryApi, type PantryItemRecord } from '../../api/pantry.api'
import { getExpiryLabel, getExpiryStatus } from '../../utils/pantryTracking'

const AdminPantryManagementPage: React.FC = () => {
  const [items, setItems] = useState<PantryItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await pantryApi.getAdminItems({
        search: search.trim(),
        status: statusFilter,
        stock: stockFilter,
        page: 1,
        limit: 200,
      })
      const nextItems = response?.data?.items ?? response?.items ?? []
      setItems(nextItems)
    } catch (error) {
      console.error(error)
      setMessageTone('error')
      setMessage('Unable to load pantry submissions.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, stockFilter])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const pendingCount = useMemo(() => items.filter((item) => item.approvalStatus === 'pending').length, [items])
  const approvedCount = useMemo(() => items.filter((item) => item.approvalStatus === 'approved').length, [items])
  const lowStockCount = useMemo(() => items.filter((item) => item.lowStock).length, [items])

  const approveItem = async (id: string) => {
    setProcessingId(id)
    try {
      await pantryApi.approveAdminItem(id)
      setMessageTone('success')
      setMessage('Pantry item approved.')
      await loadItems()
    } catch (error: any) {
      console.error(error)
      setMessageTone('error')
      setMessage(error?.response?.data?.message || 'Failed to approve pantry item.')
    } finally {
      setProcessingId(null)
    }
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm('Delete this pantry item?')) return

    setProcessingId(id)
    try {
      await pantryApi.deleteAdminItem(id)
      setMessageTone('success')
      setMessage('Pantry item deleted.')
      await loadItems()
    } catch (error: any) {
      console.error(error)
      setMessageTone('error')
      setMessage(error?.response?.data?.message || 'Failed to delete pantry item.')
    } finally {
      setProcessingId(null)
    }
  }

  const renderExpiryBadge = (expiryDate: string) => {
    const status = getExpiryStatus(expiryDate)
    if (status === 'expired') return 'bg-rose-100 text-rose-700'
    if (status === 'expiring') return 'bg-amber-100 text-amber-700'
    return 'bg-emerald-100 text-emerald-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pantry Management</h1>
        <p className="text-slate-500 mt-1 text-sm">Approve or remove pantry items submitted by students.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Submissions</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Approval</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Low Stock</p>
          <p className="mt-2 text-2xl font-black text-orange-700">{lowStockCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void loadItems()}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-left hover:border-orange-300 transition"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Refresh</p>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-orange-600">
            <RefreshCw className="h-4 w-4" />
            Reload list
          </div>
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          messageTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, category, note"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all cursor-pointer"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock Only</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Purchase</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading submissions...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No pantry submissions found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm">{item.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{item.user?.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.quantity} {item.unit}</p>
                      {item.lowStock && <p className="text-xs text-orange-600 mt-1 font-semibold">Low stock</p>}
                      {item.notes && <p className="text-xs text-slate-400 mt-1">{item.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.category}</td>
                    <td className="px-4 py-3 text-slate-700">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${renderExpiryBadge(item.expiryDate)}`}>
                        {getExpiryLabel(item.expiryDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.approvalStatus === 'approved' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {item.approvalStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => void approveItem(item.id)}
                            disabled={processingId === item.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void deleteItem(item.id)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{pendingCount} pantry item(s) are waiting for approval.</p>
        </div>
      )}
    </div>
  )
}

export default AdminPantryManagementPage
