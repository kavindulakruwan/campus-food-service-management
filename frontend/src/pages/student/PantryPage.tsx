import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, CheckCircle2, Edit2, Plus, Search } from 'lucide-react'
import {
  getExpiryLabel,
  getExpiryStatus,
  getItemsExpiringByDate,
  getPantryCategories,
  type PantryCategory,
  type PantryUnit,
} from '../../utils/pantryTracking'
import { pantryApi, type PantryItemRecord } from '../../api/pantry.api'

const PantryPage = () => {
  const [items, setItems] = useState<PantryItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all')
  const [selectedCategory, setSelectedCategory] = useState<PantryCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formQuantity, setFormQuantity] = useState<number>(1)
  const [formUnit, setFormUnit] = useState<PantryUnit>('g')
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [formExpiry, setFormExpiry] = useState('')
  const [formCategory, setFormCategory] = useState<PantryCategory>('Other')
  const [formNotes, setFormNotes] = useState('')

  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')

  const loadItems = async () => {
    setLoading(true)
    try {
      const response = await pantryApi.getMyItems()
      setItems(response?.data ?? [])
    } catch (error) {
      console.error(error)
      setMessageTone('error')
      setMessage('Unable to load pantry items right now.')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  const expiringItems = useMemo(() => getItemsExpiringByDate(items, 7), [items])
  const expiredItems = useMemo(() => items.filter((item) => getExpiryStatus(item.expiryDate) === 'expired'), [items])
  const lowStockItems = useMemo(() => items.filter((item) => item.lowStock), [items])

  const filteredItems = useMemo(() => {
    let result = items

    if (filter === 'expiring') {
      result = expiringItems
    } else if (filter === 'expired') {
      result = expiredItems
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory)
    }

    if (deferredSearch.trim()) {
      const searchLower = deferredSearch.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower) ||
          `${item.quantity}`.includes(searchLower) ||
          item.unit.toLowerCase().includes(searchLower) ||
          getExpiryLabel(item.expiryDate).toLowerCase().includes(searchLower),
      )
    }

    return result.sort((a, b) => {
      const aStatus = getExpiryStatus(a.expiryDate)
      const bStatus = getExpiryStatus(b.expiryDate)
      const statusOrder: Record<string, number> = { expired: 0, expiring: 1, good: 2 }
      return statusOrder[aStatus] - statusOrder[bStatus]
    })
  }, [items, filter, selectedCategory, deferredSearch, expiringItems, expiredItems])

  const resetForm = () => {
    setFormName('')
    setFormQuantity(1)
    setFormUnit('g')
    setFormPurchaseDate(new Date().toISOString().slice(0, 10))
    setFormExpiry('')
    setFormCategory('Other')
    setFormNotes('')
    setEditingId(null)
  }

  const handleCreateOrUpdate = async () => {
    if (!formName.trim() || !formExpiry) {
      setMessageTone('error')
      setMessage('Please fill in name and expiry date.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        quantity: formQuantity,
        unit: formUnit,
        purchaseDate: formPurchaseDate,
        expiryDate: formExpiry,
        category: formCategory,
        notes: formNotes,
      }

      if (editingId) {
        await pantryApi.updateItem(editingId, payload)
      } else {
        await pantryApi.createItem(payload)
      }

      await loadItems()
      resetForm()
      setMessageTone('success')
      setMessage(editingId
        ? 'Item updated and sent for admin approval.'
        : 'Item created successfully. Waiting for admin approval.')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error(error)
      setMessageTone('error')
      setMessage(error?.response?.data?.message || 'Failed to save pantry item.')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: PantryItemRecord) => {
    setEditingId(item.id)
    setFormName(item.name)
    setFormQuantity(item.quantity)
    setFormUnit(item.unit)
    setFormPurchaseDate(new Date(item.purchaseDate).toISOString().slice(0, 10))
    setFormExpiry(new Date(item.expiryDate).toISOString().slice(0, 10))
    setFormCategory(item.category)
    setFormNotes(item.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderExpiryBadge = (expiryDate: string) => {
    const status = getExpiryStatus(expiryDate)
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-3 w-3" />
          Expired
        </span>
      )
    }

    if (status === 'expiring') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
          <Calendar className="h-3 w-3" />
          Expiring
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Good
      </span>
    )
  }

  const renderApprovalBadge = (status: PantryItemRecord['approvalStatus']) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          Approved
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
        Pending Approval
      </span>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-orange-200/50 bg-[radial-gradient(circle_at_top_right,rgba(254,215,170,0.22),transparent_35%),linear-gradient(120deg,#0f172a_0%,#1e293b_46%,#ea580c_100%)] p-8 text-white shadow-xl shadow-orange-200/30">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">Inventory Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your pantry</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Add pantry items and track approval plus expiry from one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Items</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expiring Soon</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{expiringItems.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expired</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{expiredItems.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{items.filter((item) => item.approvalStatus === 'approved').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Low Stock</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{lowStockItems.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Update Pantry Item' : 'Create Pantry Item'}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Item name (e.g., Rice, Chicken)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={formQuantity}
              onChange={(e) => setFormQuantity(Number(e.target.value) || 1)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
              placeholder="Qty"
            />
            <select
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value as PantryUnit)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="count">count</option>
              <option value="oz">oz</option>
            </select>
          </div>
          <input
            type="date"
            value={formPurchaseDate}
            onChange={(e) => setFormPurchaseDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
          />
          <input
            type="date"
            value={formExpiry}
            onChange={(e) => setFormExpiry(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
          />
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as PantryCategory)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
          >
            {getPantryCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
          />
        </div>

        {message && (
          <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${
            messageTone === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleCreateOrUpdate}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Create Item'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Pantry Items</h2>
              <p className="text-xs text-slate-500">{filteredItems.length} result(s) shown</p>
            </div>
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, notes, unit, quantity"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-10 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15"
              />
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'expiring', 'expired'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  filter === f
                    ? 'bg-orange-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'All Items' : f === 'expiring' ? 'Expiring Soon' : 'Expired'}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap gap-2">
              {['all', ...getPantryCategories()].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as PantryCategory | 'all')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading pantry items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No pantry items match your filters or search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {renderExpiryBadge(item.expiryDate)}
                      {renderApprovalBadge(item.approvalStatus)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity} {item.unit} | {item.category} | {getExpiryLabel(item.expiryDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Purchased: {new Date(item.purchaseDate).toLocaleDateString()} | Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                    {item.notes && <p className="mt-1 text-xs text-slate-600 italic">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.lowStock && (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Low Stock
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {expiringItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900">Items Expiring Soon</h3>
              <p className="mt-1 text-sm text-amber-800">
                You have {expiringItems.length} item(s) expiring within 7 days. Consider using them soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <h3 className="font-bold text-orange-900">Low Stock Alert</h3>
              <p className="mt-1 text-sm text-orange-800">
                You have {lowStockItems.length} low-stock item(s). Consider restocking soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PantryPage
