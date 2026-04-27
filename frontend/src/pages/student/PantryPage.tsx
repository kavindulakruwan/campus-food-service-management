import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, Plus, Search, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import {
  addPantryItem,
  deletePantryItem,
  getPantryCategories,
  getExpiryLabel,
  getExpiryStatus,
  getItemsExpiringByDate,
  readPantryItems,
  updatePantryItem,
  type PantryItem,
  type PantryUnit,
  type PantryCategory,
} from '../../utils/pantryTracking'

const PantryPage = () => {
  const [items, setItems] = useState<PantryItem[]>(readPantryItems())
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all')
  const [selectedCategory, setSelectedCategory] = useState<PantryCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formQuantity, setFormQuantity] = useState<number>(1)
  const [formUnit, setFormUnit] = useState<PantryUnit>('g')
  const [formExpiry, setFormExpiry] = useState('')
  const [formCategory, setFormCategory] = useState<PantryCategory>('Other')
  const [formNotes, setFormNotes] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleStorageUpdate = () => {
      setItems(readPantryItems())
    }
    window.addEventListener('campus-bites-pantry-updated', handleStorageUpdate)
    return () => window.removeEventListener('campus-bites-pantry-updated', handleStorageUpdate)
  }, [])

  const expiringItems = useMemo(() => getItemsExpiringByDate(items, 7), [items])
  const expiredItems = useMemo(() => items.filter((item) => getExpiryStatus(item.expiryDate) === 'expired'), [items])

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

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower),
      )
    }

    return result.sort((a, b) => {
      const aStatus = getExpiryStatus(a.expiryDate)
      const bStatus = getExpiryStatus(b.expiryDate)
      const statusOrder: Record<string, number> = { expired: 0, expiring: 1, good: 2 }
      return statusOrder[aStatus] - statusOrder[bStatus]
    })
  }, [items, filter, selectedCategory, search, expiringItems, expiredItems])

  const resetForm = () => {
    setFormName('')
    setFormQuantity(1)
    setFormUnit('g')
    setFormExpiry('')
    setFormCategory('Other')
    setFormNotes('')
    setEditingId(null)
  }

  const handleAddOrUpdate = () => {
    if (!formName.trim() || !formExpiry) {
      setMessage('Please fill in name and expiry date.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (editingId) {
      updatePantryItem(editingId, {
        name: formName,
        quantity: formQuantity,
        unit: formUnit,
        expiryDate: formExpiry,
        category: formCategory,
        notes: formNotes,
      })
      setMessage('Item updated successfully.')
    } else {
      addPantryItem({
        name: formName,
        quantity: formQuantity,
        unit: formUnit,
        expiryDate: formExpiry,
        category: formCategory,
        notes: formNotes,
      })
      setMessage('Item added to pantry.')
    }

    setItems(readPantryItems())
    resetForm()
    setTimeout(() => setMessage(''), 3000)
  }

  const handleEdit = (item: PantryItem) => {
    setFormName(item.name)
    setFormQuantity(item.quantity)
    setFormUnit(item.unit)
    setFormExpiry(item.expiryDate.split('T')[0])
    setFormCategory(item.category as PantryCategory)
    setFormNotes(item.notes || '')
    setEditingId(item.id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this item?')) {
      deletePantryItem(id)
      setItems(readPantryItems())
      setMessage('Item removed from pantry.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const renderStatusBadge = (item: PantryItem) => {
    const status = getExpiryStatus(item.expiryDate)
    if (status === 'expired') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
        <AlertCircle className="h-3 w-3" />
        Expired
      </span>
    }
    if (status === 'expiring') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
        <Calendar className="h-3 w-3" />
        Expiring
      </span>
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Good
    </span>
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Inventory Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your pantry</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Track ingredients, manage expiry dates, and reduce food waste. Get suggestions for recipes using items you already have.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Items</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expiring Soon</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{expiringItems.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expired</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{expiredItems.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add or Update Item</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Item name (e.g., Rice, Chicken)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={formQuantity}
              onChange={(e) => setFormQuantity(Number(e.target.value) || 1)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Qty"
            />
            <select
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value as PantryUnit)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            value={formExpiry}
            onChange={(e) => setFormExpiry(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as PantryCategory)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {message && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleAddOrUpdate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {editingId ? 'Update Item' : 'Add Item'}
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
            <h2 className="text-lg font-bold text-slate-900">My Pantry Items</h2>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'expiring', 'expired'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
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
                      ? 'bg-emerald-600 text-white'
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
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No pantry items match your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {renderStatusBadge(item)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity} {item.unit} • {item.category} • {getExpiryLabel(item.expiryDate)}
                    </p>
                    {item.notes && <p className="mt-1 text-xs text-slate-600 italic">{item.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white"
                      title="Edit item"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
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
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900">Items Expiring Soon</h3>
              <p className="mt-1 text-sm text-amber-800">
                You have {expiringItems.length} item(s) expiring within 7 days. Consider using them in your next recipes!
              </p>
              <div className="mt-3 space-y-1">
                {expiringItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-sm text-amber-800">
                    • <span className="font-semibold">{item.name}</span> - {getExpiryLabel(item.expiryDate)}
                  </div>
                ))}
                {expiringItems.length > 5 && (
                  <div className="text-sm text-amber-700">+ {expiringItems.length - 5} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {expiredItems.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-900">Expired Items</h3>
              <p className="mt-1 text-sm text-rose-800">
                You have {expiredItems.length} expired item(s). Please remove them to keep your pantry clean.
              </p>
              <div className="mt-3 space-y-1">
                {expiredItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-sm text-rose-800">
                    • <span className="font-semibold">{item.name}</span> - {getExpiryLabel(item.expiryDate)}
                  </div>
                ))}
                {expiredItems.length > 5 && (
                  <div className="text-sm text-rose-700">+ {expiredItems.length - 5} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PantryPage
