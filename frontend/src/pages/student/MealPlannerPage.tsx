
import { Fragment, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  createMealPlan,
  deleteMealPlan,
  duplicateWeekPlans,
  getMonthlyMealPlans,
  getWeeklyMealPlans,
  quickCopyWeekPlans,
  updateMealPlan,
} from '../../api/mealPlan.api'
import type { MealPlanItem, MealTime } from '../../types/mealPlan'
import { MealPlannerChatbot } from '../../components/ui/MealPlannerChatbot'
import { PREDEFINED_MEALS } from '../../utils/mealOptions'
import './MealPlannerPage.css'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner']

type EditorMode = 'create' | 'edit'

interface EditorState {
  mode: EditorMode
  mealId: string | null
  date: string
  mealTime: MealTime
  mealName: string
  quantity: number
  notes: string
}

const mealTimeTitle = (mealTime: MealTime) => mealTime[0].toUpperCase() + mealTime.slice(1)

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

const toReadableDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const plannerEmptyState = (date: string, mealTime: MealTime): EditorState => ({
  mode: 'create',
  mealId: null,
  date,
  mealTime,
  mealName: '',
  quantity: 1,
  notes: '',
})

const toApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string } | undefined
    return payload?.message || fallback
  }

  if (error instanceof Error) return error.message
  return fallback
}

const MealPlannerPage = () => {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeekMonday(new Date()))
  const [weekPlans, setWeekPlans] = useState<MealPlanItem[]>([])
  const [monthPlans, setMonthPlans] = useState<MealPlanItem[]>([])
  const [isLoadingWeek, setIsLoadingWeek] = useState(false)
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [overwriteOnCopy, setOverwriteOnCopy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'si'>('en')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [editorStep, setEditorStep] = useState<1 | 2>(1)
  const [editor, setEditor] = useState<EditorState>(() =>
    plannerEmptyState(formatDateKey(startOfWeekMonday(new Date())), 'breakfast'),
  )

  const weekStartKey = useMemo(() => formatDateKey(weekStart), [weekStart])

  const weekDays = useMemo(
    () => WEEK_DAYS.map((label, index) => ({ label, date: addDays(weekStart, index) })),
    [weekStart],
  )

  const monthContext = useMemo(
    () => ({ year: weekStart.getFullYear(), month: weekStart.getMonth() + 1 }),
    [weekStart],
  )

  const slotMap = useMemo(() => {
    const map = new Map<string, MealPlanItem>()
    weekPlans.forEach((item) => {
      map.set(`${item.date}-${item.mealTime}`, item)
    })
    return map
  }, [weekPlans])

  const mealsByDate = useMemo(() => {
    const grouped = new Map<string, MealPlanItem[]>()
    monthPlans.forEach((meal) => {
      const items = grouped.get(meal.date) || []
      items.push(meal)
      grouped.set(meal.date, items)
    })
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [monthPlans])

  const stats = useMemo(() => {
    const mealCount = weekPlans.length
    const totalQuantity = weekPlans.reduce((acc, meal) => acc + meal.quantity, 0)
    const activeDays = new Set(weekPlans.map((meal) => meal.date)).size
    return { mealCount, totalQuantity, activeDays }
  }, [weekPlans])

  const loadWeekPlans = async (startDate: string) => {
    setIsLoadingWeek(true)
    try {
      const response = await getWeeklyMealPlans(startDate)
      setWeekPlans(response.data.data.plans)
    } finally {
      setIsLoadingWeek(false)
    }
  }

  const loadMonthPlans = async (year: number, month: number) => {
    setIsLoadingMonth(true)
    try {
      const response = await getMonthlyMealPlans(year, month)
      setMonthPlans(response.data.data.plans)
    } finally {
      setIsLoadingMonth(false)
    }
  }

  useEffect(() => {
    const syncData = async () => {
      setErrorMessage(null)
      try {
        await Promise.all([
          loadWeekPlans(weekStartKey),
          loadMonthPlans(monthContext.year, monthContext.month),
        ])
      } catch (error) {
        setErrorMessage(toApiMessage(error, 'Unable to load meal plans. If your session expired, please log out and log back in.'))
      }
    }

    void syncData()
  }, [weekStartKey, monthContext.year, monthContext.month])

  useEffect(() => {
    const firstDay = weekDays[0]
    if (!firstDay) return
    setEditor((prev) => ({ ...prev, date: firstDay.date ? formatDateKey(firstDay.date) : prev.date }))
  }, [weekDays])

  const openCreateEditor = (date: string, mealTime: MealTime) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setEditorStep(1)
    setEditor(plannerEmptyState(date, mealTime))
    setSelectedComponents([])
    setSearchQuery('')
  }

  const openEditEditor = (meal: MealPlanItem) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setEditorStep(1)
    setEditor({
      mode: 'edit',
      mealId: meal.id,
      date: meal.date,
      mealTime: meal.mealTime,
      mealName: meal.mealName,
      quantity: meal.quantity,
      notes: meal.notes,
    })
    setSelectedComponents(meal.mealName ? meal.mealName.split(' + ').map(s => s.trim()).filter(Boolean) : [])
    setSearchQuery('')
  }

  const handleAddComponent = (itemName: string) => {
    const newItems = [...selectedComponents, itemName]
    setSelectedComponents(newItems)
    setEditor((prev) => ({ ...prev, mealName: newItems.join(' + ') }))
  }

  const handleRemoveComponent = (index: number) => {
    const newItems = selectedComponents.filter((_, i) => i !== index)
    setSelectedComponents(newItems)
    setEditor((prev) => ({ ...prev, mealName: newItems.join(' + ') }))
  }

  const runRefresh = async () => {
    await Promise.all([
      loadWeekPlans(weekStartKey),
      loadMonthPlans(monthContext.year, monthContext.month),
    ])
  }

  const handleEditorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const payload = {
        date: editor.date,
        mealTime: editor.mealTime,
        mealName: editor.mealName.trim(),
        quantity: editor.quantity,
        notes: editor.notes.trim(),
      }

      if (editor.mode === 'create') {
        await createMealPlan(payload)
        setSuccessMessage('Meal added to your plan.')
      } else if (editor.mealId) {
        await updateMealPlan(editor.mealId, payload)
        setSuccessMessage('Meal plan updated.')
      }

      setEditorStep(1)
      await runRefresh()
    } catch (error) {
      setErrorMessage(toApiMessage(error, 'Unable to save meal plan.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editor.mealId) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await deleteMealPlan(editor.mealId)
      setSuccessMessage('Meal removed from the plan.')
      setEditorStep(1)
      setEditor(plannerEmptyState(editor.date, editor.mealTime))
      await runRefresh()
    } catch (error) {
      setErrorMessage(toApiMessage(error, 'Unable to delete meal plan.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickCopy = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const response = await quickCopyWeekPlans({
        targetWeekStart: weekStartKey,
        strategy: 'previous-week',
        overwrite: overwriteOnCopy,
      })

      await runRefresh()
      setSuccessMessage(`${response.data.data.copiedCount} meal slots copied into this week.`)
    } catch (error) {
      setErrorMessage(toApiMessage(error, 'Quick copy failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicateToNextWeek = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const targetWeekStart = formatDateKey(addDays(weekStart, 7))
      const response = await duplicateWeekPlans({
        sourceWeekStart: weekStartKey,
        targetWeekStart,
        overwrite: overwriteOnCopy,
      })

      setSuccessMessage(
        `${response.data.data.copiedCount} meal slots duplicated to week of ${toReadableDate(targetWeekStart)}.`,
      )
    } catch (error) {
      setErrorMessage(toApiMessage(error, 'Duplicate week failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-800 font-sans">
      <header className="relative bg-gradient-to-br from-orange-50 to-indigo-50 border border-slate-200 rounded-2xl p-6 md:p-8 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-orange-600 font-bold tracking-wider text-xs uppercase mb-2">Member 2 Delivery</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Meal Planning Studio</h2>
            <p className="text-slate-600 leading-relaxed">
              Plan breakfast, lunch, and dinner with a fast week grid, then review monthly output at a glance.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <article className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col min-w-[120px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Planned meals</span>
              <strong className="text-2xl font-bold text-slate-800">{stats.mealCount}</strong>
            </article>
            <article className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col min-w-[120px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Total portions</span>
              <strong className="text-2xl font-bold text-slate-800">{stats.totalQuantity}</strong>
            </article>
            <article className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col min-w-[120px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Active days</span>
              <strong className="text-2xl font-bold text-slate-800">{stats.activeDays}/7</strong>
            </article>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, -7))} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors">
            Previous week
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeekMonday(new Date()))} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors">
            Current week
          </button>
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, 7))} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors">
            Next week
          </button>
          <p className="text-sm text-slate-600 font-medium ml-2">
            {toReadableDate(weekStartKey)} - {toReadableDate(formatDateKey(addDays(weekStart, 6)))}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={overwriteOnCopy}
              onChange={(event) => setOverwriteOnCopy(event.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            Overwrite target week
          </label>
          <button type="button" onClick={handleQuickCopy} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50">
            Quick copy previous week
          </button>
          <button type="button" onClick={handleDuplicateToNextWeek} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 border border-transparent">
            Duplicate to next week
          </button>
        </div>
      </div>

      {(errorMessage || successMessage) && (
        <div className={`p-4 rounded-xl border ${errorMessage ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          <p className="text-sm font-medium m-0">{errorMessage || successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Weekly meal grid</h3>
            {isLoadingWeek && <span className="text-sm text-slate-500 animate-pulse">Refreshing week...</span>}
          </div>

          <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)] gap-3 bg-slate-50/50 p-3 rounded-xl">
            <div className="flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-wider bg-slate-100 rounded-xl p-2 border border-slate-200/60">Time</div>
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day.date)
              return (
                <div key={dateKey} className="flex flex-col items-center justify-center bg-slate-100 rounded-xl p-3 border border-slate-200/60">
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">{day.label}</p>
                  <strong className="text-slate-800 text-sm mt-1">{toReadableDate(dateKey)}</strong>
                </div>
              )
            })}

            {MEAL_TIMES.map((mealTime) => (
              <Fragment key={mealTime}>
                <div key={`label-${mealTime}`} className="flex items-center justify-center font-bold text-slate-500 text-xs uppercase tracking-wider bg-slate-100 rounded-xl p-2 border border-slate-200/60 writing-vertical-lr text-center h-full break-all" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                  {mealTimeTitle(mealTime)}
                </div>
                {weekDays.map((day) => {
                  const dateKey = formatDateKey(day.date)
                  const meal = slotMap.get(`${dateKey}-${mealTime}`)
                  const key = `${dateKey}-${mealTime}`

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`relative min-h-[110px] rounded-xl p-3 text-left transition-all duration-200 border flex flex-col gap-1 items-start ${
                        meal 
                          ? 'bg-gradient-to-b from-white to-green-50 border-green-200 hover:border-green-300 hover:shadow-md hover:-translate-y-0.5' 
                          : 'bg-white border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/30'
                      }`}
                      onClick={() => (meal ? openEditEditor(meal) : openCreateEditor(dateKey, mealTime))}
                    >
                      {meal ? (
                        <>
                          <strong className="text-sm text-slate-800 leading-tight block mb-1">{meal.mealName}</strong>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                            {meal.quantity} portion{meal.quantity > 1 ? 's' : ''}
                          </span>
                          {meal.notes ? <small className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{meal.notes}</small> : null}
                        </>
                      ) : (
                        <span className="m-auto text-xs font-medium text-slate-400">Add meal</span>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-800">{editor.mode === 'create' ? 'Add meal slot' : 'Edit meal slot'}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {toReadableDate(editor.date)} - <span className="font-medium text-indigo-600">{mealTimeTitle(editor.mealTime)}</span>
            </p>
          </div>

          <form onSubmit={handleEditorSubmit} className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">
            {editorStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Date
                    <input
                      type="date"
                      value={editor.date}
                      onChange={(event) => setEditor((prev) => ({ ...prev, date: event.target.value }))}
                      required
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Meal Time
                    <select
                      value={editor.mealTime}
                      onChange={(event) =>
                        setEditor((prev) => ({ ...prev, mealTime: event.target.value as MealTime }))
                      }
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none"
                    >
                      {MEAL_TIMES.map((mealTime) => (
                        <option key={mealTime} value={mealTime}>
                          {mealTimeTitle(mealTime)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Design your plate</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                      <button type="button" onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
                      <button type="button" onClick={() => setLanguage('si')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${language === 'si' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>සිංහල</button>
                    </div>
                  </div>

                  {selectedComponents.length > 0 && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Current Plate</p>
                        <button type="button" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium" onClick={() => {
                          setSelectedComponents([])
                          setEditor(prev => ({ ...prev, mealName: '' }))
                        }}>
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedComponents.map((comp, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg shadow-sm">
                            {comp}
                            <button type="button" className="w-4 h-4 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-700" onClick={() => handleRemoveComponent(idx)}>
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <input
                      type="search"
                      placeholder="Search meals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <select 
                      value={selectedCategory} 
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[130px]"
                    >
                      <option value="All">All Categories</option>
                      <option value="Full Meals">Full Meals</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Salads">Salads</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Breakfast Bowls">Breakfast Bowls</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl mb-4 scrollbar-thin">
                    {PREDEFINED_MEALS
                      .filter(m => selectedCategory === 'All' || m.category === selectedCategory)
                      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.sinhalaName && m.sinhalaName.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map((meal) => {
                      const mealDisplayTitle = language === 'si' && meal.sinhalaName ? meal.sinhalaName : meal.name
                      return (
                        <button
                          key={meal.id}
                          type="button"
                          className="flex flex-col items-start gap-1 p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                          onClick={() => handleAddComponent(mealDisplayTitle)}
                        >
                          <strong className="text-xs text-slate-800 line-clamp-2 leading-tight">{mealDisplayTitle}</strong>
                          <small className="text-[10px] text-slate-500 font-medium">{meal.category} • Rs. {meal.price}</small>
                        </button>
                      )
                    })}
                  </div>

                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                    Final Meal Name
                    <input
                      type="text"
                      maxLength={120}
                      value={editor.mealName}
                      onChange={(event) => {
                        const newName = event.target.value
                        setEditor((prev) => ({ ...prev, mealName: newName }))
                        setSelectedComponents(newName ? newName.split(' + ').map(s => s.trim()).filter(Boolean) : [])
                      }}
                      placeholder="Ex: Chicken rice bowl"
                      required
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </label>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="button" 
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!editor.mealName.trim()}
                    onClick={() => {
                      if (editor.mealName.trim()) setEditorStep(2)
                    }}
                  >
                    Continue to Portions &rarr;
                  </button>
                </div>
              </>
            )}

            {editorStep === 2 && (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-2">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Ready to Schedule</p>
                  <strong className="text-lg text-indigo-900 leading-tight">{editor.mealName}</strong>
                </div>

                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                  Portions
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editor.quantity}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, quantity: Number(event.target.value) || 1 }))
                    }
                    required
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                  Notes
                  <textarea
                    maxLength={300}
                    rows={4}
                    value={editor.notes}
                    onChange={(event) => setEditor((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Optional prep notes or serving instructions"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                  />
                </label>

                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setEditorStep(1)}
                      className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors flex-1"
                    >
                      &larr; Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex-[2]"
                    >
                      {editor.mode === 'create' ? 'Save to Plan' : 'Update Plan'}
                    </button>
                  </div>
                  {editor.mode === 'edit' && (
                    <button 
                      type="button" 
                      onClick={handleDelete} 
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Remove from Plan
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </aside>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 md:p-6 mt-4">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Monthly overview</h3>
          {isLoadingMonth && <span className="text-sm text-slate-500 font-medium">Refreshing...</span>}
        </div>

        {mealsByDate.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No meals planned this month yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mealsByDate.map(([dateKey, meals]) => (
              <article key={dateKey} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                <h4 className="font-bold text-slate-700 mb-3 text-sm pb-2 border-b border-slate-200">{toReadableDate(dateKey)}</h4>
                <div className="flex flex-col gap-2">
                  {meals.map((meal) => (
                    <button 
                      key={meal.id} 
                      type="button" 
                      onClick={() => openEditEditor(meal)}
                      className="flex flex-col items-start gap-0.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                    >
                      <strong className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">{mealTimeTitle(meal.mealTime)}</strong>
                      <span className="text-sm text-slate-800 font-medium leading-tight">{meal.mealName}</span>
                      <small className="text-[11px] text-slate-500 mt-1">{meal.quantity} portion{meal.quantity > 1 ? 's' : ''}</small>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <MealPlannerChatbot />
    </div>
  )
}

export default MealPlannerPage
