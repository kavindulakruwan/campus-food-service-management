import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, PencilLine, PlusCircle, Search, Trash2, Utensils } from 'lucide-react'
import { createMeal, deleteMeal, getMeals, updateMeal, type MealItem } from '../../api/meals.api'

type Category = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'

const categoryOptions: Category[] = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

const emptyForm = {
  name: '',
  category: 'lunch' as Category,
  price: 0,
  calories: 0,
  description: '',
  imageUrl: '',
  isAvailable: true,
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const AdminMealManagementPage = () => {
  const [meals, setMeals] = useState<MealItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)

  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const loadMeals = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getMeals({
        search: query,
        category,
      })
      setMeals(response.data.data.meals)
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.message || 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMeals()
  }, [query, category])

  const stats = useMemo(() => ({
    total: meals.length,
    available: meals.filter((meal) => meal.isAvailable).length,
    outOfStock: meals.filter((meal) => !meal.isAvailable).length,
  }), [meals])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setQuery(searchText.trim())
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!createForm.imageUrl) {
      setError('Please select a meal image before creating the meal')
      return
    }

    try {
      const response = await createMeal(createForm)
      setMessage(response.data.message)
      setCreateOpen(false)
      setCreateForm(emptyForm)
      await loadMeals()
    } catch (createError: any) {
      setError(createError?.response?.data?.message || 'Failed to create meal')
    }
  }

  const openEdit = (meal: MealItem) => {
    setEditingMeal(meal)
    setEditForm({
      name: meal.name,
      category: meal.category,
      price: meal.price,
      calories: meal.calories,
      description: meal.description || '',
      imageUrl: meal.imageUrl || '',
      isAvailable: meal.isAvailable,
    })
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingMeal) return
    setError('')
    setMessage('')

    try {
      const response = await updateMeal(editingMeal.id, editForm)
      setMessage(response.data.message)
      setEditingMeal(null)
      await loadMeals()
    } catch (updateError: any) {
      setError(updateError?.response?.data?.message || 'Failed to update meal')
    }
  }

  const handleDelete = async (meal: MealItem) => {
    const confirmed = window.confirm(`Delete meal "${meal.name}"?`)
    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      const response = await deleteMeal(meal.id)
      setMessage(response.data.message)
      await loadMeals()
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.message || 'Failed to delete meal')
    }
  }

  const handleToggleAvailability = async (meal: MealItem) => {
    setError('')
    setMessage('')
    try {
      const response = await updateMeal(meal.id, { isAvailable: !meal.isAvailable })
      setMessage(response.data.message)
      await loadMeals()
    } catch (updateError: any) {
      setError(updateError?.response?.data?.message || 'Failed to update availability')
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">Meal Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Admin meal control center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Add new meals, edit details, delete unavailable meals, mark stock status, and categorize meals.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Meals</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              placeholder="Search meal by name or keyword"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(event) => setCategory(event.target.value as 'all' | Category)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All Categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
            <button type="button" onClick={() => setCreateOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              <PlusCircle className="h-4 w-4" />
              {createOpen ? 'Close Add Meal' : 'Add Meal'}
            </button>
          </div>
        </form>

        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

        {createOpen && (
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Meal Name</label>
              <input
                required
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Enter meal name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Category</label>
              <select
                value={createForm.category}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value as Category }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Price</label>
              <input
                required
                type="number"
                min={0}
                value={createForm.price}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Choose File</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    setCreateForm((prev) => ({ ...prev, imageUrl: '' }))
                    return
                  }

                  if (file.size > 4 * 1024 * 1024) {
                    setError('Please choose an image smaller than 4MB')
                    return
                  }

                  try {
                    const dataUrl = await fileToDataUrl(file)
                    setCreateForm((prev) => ({ ...prev, imageUrl: dataUrl }))
                    setError('')
                  } catch {
                    setError('Failed to process selected image')
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Description</label>
              <textarea
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter description"
              />
            </div>

            {createForm.imageUrl && (
              <div className="md:col-span-2">
                <img src={createForm.imageUrl} alt="Meal preview" className="h-32 w-48 rounded-xl border border-slate-200 object-cover" />
              </div>
            )}

            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Create Meal</button>
            </div>
          </form>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">No meals found</div>
        ) : meals.map((meal) => (
          <article key={meal.id} className="group mx-auto w-full max-w-[265px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-orange-400"><Utensils className="h-10 w-10" /></div>
              )}
              <button onClick={() => handleToggleAvailability(meal)} className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meal.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {meal.isAvailable ? 'Available' : 'Out of Stock'}
              </button>
            </div>

            <div className="space-y-2.5 p-3">
              <div className="flex items-center justify-between">
                <h2 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-900">{meal.name}</h2>
                <span className="text-xs font-semibold uppercase text-slate-500">{meal.category}</span>
              </div>

              <p className="line-clamp-2 min-h-9 text-xs text-slate-500">{meal.description || 'No description provided.'}</p>

              <p className="pt-0.5 text-3xl font-black text-orange-500">LKR {meal.price.toFixed(0)}</p>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openEdit(meal)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 sm:text-sm"><PencilLine className="h-3.5 w-3.5" /> Edit</button>
                <button type="button" onClick={() => handleDelete(meal)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 sm:text-sm"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editingMeal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold text-slate-900">Edit Meal</h3>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Meal name" />
              <select value={editForm.category} onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value as Category }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
                ))}
              </select>
              <input type="number" min={0} value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: Number(event.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Price" />
              <input type="number" min={0} value={editForm.calories} onChange={(event) => setEditForm((prev) => ({ ...prev, calories: Number(event.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Calories" />
              <textarea value={editForm.description} onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Description" />
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return

                  if (file.size > 4 * 1024 * 1024) {
                    setError('Please choose an image smaller than 4MB')
                    return
                  }

                  try {
                    const dataUrl = await fileToDataUrl(file)
                    setEditForm((prev) => ({ ...prev, imageUrl: dataUrl }))
                    setError('')
                  } catch {
                    setError('Failed to process selected image')
                  }
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
              />
              {editForm.imageUrl && (
                <div className="md:col-span-2">
                  <img src={editForm.imageUrl} alt="Meal preview" className="h-28 w-44 rounded-xl border border-slate-200 object-cover" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" checked={editForm.isAvailable} onChange={(event) => setEditForm((prev) => ({ ...prev, isAvailable: event.target.checked }))} />
                Available
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingMeal(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default AdminMealManagementPage