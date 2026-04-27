import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createMealPlan } from '../../api/mealPlan.api'
import {
  deleteAdminMealPlan,
  getAdminMealPlans,
  updateAdminMealPlan,
  type AdminMealPlanItem,
} from '../../api/admin.api'
import type { MealPlanInput, MealTime } from '../../types/mealPlan'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner']

interface EditorState {
  mode: 'create' | 'edit'
  mealId: string | null
  date: string
  mealTime: MealTime
  mealName: string
  quantity: number
  notes: string
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeekMonday = (date: Date) => {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const mealTitle = (mealTime: MealTime) => mealTime.charAt(0).toUpperCase() + mealTime.slice(1)

const toReadableDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const fallbackMessage = (error: unknown, defaultMessage: string) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const maybeResponse = error as { response?: { data?: { message?: string } } }
    return maybeResponse.response?.data?.message || defaultMessage
  }

  if (error instanceof Error) return error.message
  return defaultMessage
}

const getMonthBounds = (date: Date) => ({
  start: new Date(date.getFullYear(), date.getMonth(), 1),
  end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
})

const mealOrder: Record<MealTime, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
}

const compareMealPlans = (left: AdminMealPlanItem, right: AdminMealPlanItem) => {
  const dateDiff = left.date.localeCompare(right.date)
  if (dateDiff !== 0) return dateDiff

  const timeDiff = mealOrder[left.mealTime] - mealOrder[right.mealTime]
  if (timeDiff !== 0) return timeDiff

  return (left.user?.name || '').localeCompare(right.user?.name || '')
}

const AdminMealPlannerPage = () => {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeekMonday(new Date()))
  const [weekPlans, setWeekPlans] = useState<AdminMealPlanItem[]>([])
  const [monthPlans, setMonthPlans] = useState<AdminMealPlanItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editor, setEditor] = useState<EditorState>(() => ({
    mode: 'create',
    mealId: null,
    date: formatDateKey(startOfWeekMonday(new Date())),
    mealTime: 'breakfast',
    mealName: '',
    quantity: 1,
    notes: '',
  }))

  const weekStartKey = useMemo(() => formatDateKey(weekStart), [weekStart])
  const weekEndKey = useMemo(() => formatDateKey(addDays(weekStart, 6)), [weekStart])
  const monthBounds = useMemo(() => getMonthBounds(weekStart), [weekStart])
  const monthStartKey = useMemo(() => formatDateKey(monthBounds.start), [monthBounds.start])
  const monthEndKey = useMemo(() => formatDateKey(monthBounds.end), [monthBounds.end])

  const sortedWeekPlans = useMemo(
    () => [...weekPlans].sort(compareMealPlans),
    [weekPlans],
  )

  const sortedMonthPlans = useMemo(
    () => [...monthPlans].sort(compareMealPlans),
    [monthPlans],
  )

  const studentPlans = useMemo(
    () => sortedWeekPlans.filter((plan) => plan.user?.role === 'student'),
    [sortedWeekPlans],
  )

  const adminPlans = useMemo(
    () => sortedWeekPlans.filter((plan) => plan.user?.role === 'admin'),
    [sortedWeekPlans],
  )

  const creatorStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; count: number }>()

    sortedWeekPlans.forEach((plan) => {
      const key = plan.user?.id || 'unassigned'
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
        return
      }

      map.set(key, {
        id: key,
        name: plan.user?.name || 'Unassigned',
        role: plan.user?.role || 'unknown',
        count: 1,
      })
    })

    return Array.from(map.values()).sort((left, right) => right.count - left.count)
  }, [sortedWeekPlans])

  const stats = useMemo(() => ({
    totalSlots: sortedWeekPlans.length,
    studentSlots: studentPlans.length,
    adminSlots: adminPlans.length,
    uniqueCreators: creatorStats.length,
    totalQuantity: sortedWeekPlans.reduce((sum, item) => sum + item.quantity, 0),
  }), [adminPlans.length, creatorStats.length, sortedWeekPlans, studentPlans.length])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [weekResponse, monthResponse] = await Promise.all([
        getAdminMealPlans({ startDate: weekStartKey, endDate: weekEndKey, limit: 500 }),
        getAdminMealPlans({ startDate: monthStartKey, endDate: monthEndKey, limit: 500 }),
      ])

      setWeekPlans(weekResponse.data.data.mealPlans)
      setMonthPlans(monthResponse.data.data.mealPlans)
    } catch (error: unknown) {
      setErrorMessage(fallbackMessage(error, 'Unable to load meal planner data.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [weekStartKey, weekEndKey, monthStartKey, monthEndKey])

  useEffect(() => {
    setEditor((previous) => ({ ...previous, date: weekStartKey }))
  }, [weekStartKey])

  const openCreate = (date: string, mealTime: MealTime) => {
    setSuccessMessage('')
    setErrorMessage('')
    setEditor({
      mode: 'create',
      mealId: null,
      date,
      mealTime,
      mealName: '',
      quantity: 1,
      notes: '',
    })
  }

  const openEdit = (plan: AdminMealPlanItem) => {
    setSuccessMessage('')
    setErrorMessage('')
    setEditor({
      mode: 'edit',
      mealId: plan.id,
      date: plan.date,
      mealTime: plan.mealTime,
      mealName: plan.mealName,
      quantity: plan.quantity,
      notes: plan.notes || '',
    })
  }

  const resetEditor = () => {
    setEditor((previous) => ({
      mode: 'create',
      mealId: null,
      date: previous.date,
      mealTime: previous.mealTime,
      mealName: '',
      quantity: 1,
      notes: '',
    }))
  }

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editor.mealName.trim()) {
      setErrorMessage('Meal name is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload: MealPlanInput = {
        date: editor.date,
        mealTime: editor.mealTime,
        mealName: editor.mealName.trim(),
        quantity: Number(editor.quantity || 1),
        notes: editor.notes.trim(),
      }

      if (editor.mode === 'create') {
        await createMealPlan(payload)
        setSuccessMessage('Meal entry created successfully.')
      } else if (editor.mealId) {
        await updateAdminMealPlan(editor.mealId, payload)
        setSuccessMessage('Meal entry updated successfully.')
      }

      await loadData()
      resetEditor()
    } catch (error: unknown) {
      setErrorMessage(fallbackMessage(error, 'Unable to save meal plan.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const removePlan = async (plan: AdminMealPlanItem) => {
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteAdminMealPlan(plan.id)
      setSuccessMessage('Meal entry deleted.')
      await loadData()

      if (editor.mealId === plan.id) {
        resetEditor()
      }
    } catch (error: unknown) {
      setErrorMessage(fallbackMessage(error, 'Unable to delete meal plan.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#4f46e5_100%)] p-7 text-white shadow-[0_24px_70px_-24px_rgba(79,70,229,0.65)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-16 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Admin Meal Planner</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">All meal submissions in one place</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-100/90 sm:text-base">
          Review student-created meal plans separately from admin entries, edit anything that needs adjustment, and keep the catalog names clean.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase text-slate-500">Weekly Submissions</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.totalSlots}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase text-slate-500">Student Plans</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{stats.studentSlots}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase text-slate-500">Admin Plans</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">{stats.adminSlots}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase text-slate-500">Unique Creators</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{stats.uniqueCreators}</p>
        </article>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((previous) => addDays(previous, -7))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Previous Week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Current Week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((previous) => addDays(previous, 7))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next Week
          </button>

          <div className="ml-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Week starting {toReadableDate(weekStartKey)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Submissions</h2>
              <p className="text-sm text-slate-500">Each row shows the creator name, selected meal, and the slot it belongs to.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading planner...</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-280 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Creator</th>
                    <th className="px-3 py-3">Meal</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Qty</th>
                    <th className="px-3 py-3">Notes</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWeekPlans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">
                        No meal submissions found for this week.
                      </td>
                    </tr>
                  ) : (
                    sortedWeekPlans.map((plan) => (
                      <tr key={plan.id} className="border-b border-slate-100 align-top even:bg-slate-50/40">
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          <div>{toReadableDate(plan.date)}</div>
                          <div className="text-xs font-normal text-slate-500">{plan.date}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900">{plan.user?.name || 'Unknown user'}</span>
                            <span className="text-xs text-slate-500">{plan.user?.email || 'No email available'}</span>
                            <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${plan.user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {plan.user?.role || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-indigo-900">{plan.mealName}</td>
                        <td className="px-3 py-3 text-slate-600">{mealTitle(plan.mealTime)}</td>
                        <td className="px-3 py-3 text-slate-600">{plan.quantity}</td>
                        <td className="px-3 py-3 text-slate-600">{plan.notes || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(plan)}
                              className="rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removePlan(plan)}
                              className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
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
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Creator Split</h2>
          <p className="text-sm text-slate-500">Separate visibility for student-created and admin-created meal plans.</p>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-emerald-900">Student-created</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700">{studentPlans.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {studentPlans.length === 0 ? (
                  <span className="text-sm text-emerald-700/80">No student submissions this week.</span>
                ) : (
                  studentPlans.slice(0, 6).map((plan) => (
                    <span key={plan.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                      {plan.user?.name || 'Unknown'} - {plan.mealName}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-indigo-900">Admin-created</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-indigo-700">{adminPlans.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {adminPlans.length === 0 ? (
                  <span className="text-sm text-indigo-700/80">No admin submissions this week.</span>
                ) : (
                  adminPlans.slice(0, 6).map((plan) => (
                    <span key={plan.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                      {plan.user?.name || 'Admin'} - {plan.mealName}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-900">Monthly Snapshot</h3>
              <p className="text-sm text-slate-500">{sortedMonthPlans.length} total entries in the current month.</p>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {sortedMonthPlans.slice(0, 8).map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{plan.mealName}</div>
                    <div className="text-xs text-slate-500">
                      {toReadableDate(plan.date)} - {mealTitle(plan.mealTime)} - {plan.user?.name || 'Unknown user'}
                    </div>
                  </div>
                ))}
                {sortedMonthPlans.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                    No entries recorded for this month.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </section>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          {editor.mode === 'create' ? 'Create Admin Meal Entry' : 'Update Meal Entry'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          New entries are saved under the signed-in admin account. You can still edit or remove any submitted meal plan from the list above.
        </p>

        <form className="mt-4 grid gap-3" onSubmit={(event) => void submitEditor(event)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              value={editor.date}
              onChange={(event) => setEditor((previous) => ({ ...previous, date: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              required
            />

            <select
              value={editor.mealTime}
              onChange={(event) => setEditor((previous) => ({ ...previous, mealTime: event.target.value as MealTime }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              {MEAL_TIMES.map((mealTime) => (
                <option key={mealTime} value={mealTime}>{mealTitle(mealTime)}</option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              max={50}
              value={editor.quantity}
              onChange={(event) => setEditor((previous) => ({ ...previous, quantity: Number(event.target.value) || 1 }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <input
            value={editor.mealName}
            onChange={(event) => setEditor((previous) => ({ ...previous, mealName: event.target.value }))}
            placeholder="Meal name"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />

          <textarea
            value={editor.notes}
            onChange={(event) => setEditor((previous) => ({ ...previous, notes: event.target.value }))}
            placeholder="Notes (optional)"
            rows={3}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editor.mode === 'create' ? 'Create Entry' : 'Update Entry'}
            </button>
            <button
              type="button"
              onClick={resetEditor}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </section>
  )
}

export default AdminMealPlannerPage
