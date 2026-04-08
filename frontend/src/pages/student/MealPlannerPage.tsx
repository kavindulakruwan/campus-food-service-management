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
    setEditor(plannerEmptyState(date, mealTime))
  }

  const openEditEditor = (meal: MealPlanItem) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setEditor({
      mode: 'edit',
      mealId: meal.id,
      date: meal.date,
      mealTime: meal.mealTime,
      mealName: meal.mealName,
      quantity: meal.quantity,
      notes: meal.notes,
    })
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
    <section className="meal-planner-shell">
      <header className="meal-planner-hero">
        <div>
          <p className="meal-planner-kicker">Member 2 Delivery</p>
          <h2>Meal Planning Studio</h2>
          <p>
            Plan breakfast, lunch, and dinner with a fast week grid, then review monthly output at a
            glance.
          </p>
        </div>

        <div className="meal-planner-stats">
          <article>
            <span>Planned meals</span>
            <strong>{stats.mealCount}</strong>
          </article>
          <article>
            <span>Total portions</span>
            <strong>{stats.totalQuantity}</strong>
          </article>
          <article>
            <span>Active days</span>
            <strong>{stats.activeDays}/7</strong>
          </article>
        </div>
      </header>

      <div className="meal-planner-toolbar">
        <div className="week-controls">
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
            Previous week
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
            Current week
          </button>
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
            Next week
          </button>
          <p>
            {toReadableDate(weekStartKey)} - {toReadableDate(formatDateKey(addDays(weekStart, 6)))}
          </p>
        </div>

        <div className="copy-controls">
          <label>
            <input
              type="checkbox"
              checked={overwriteOnCopy}
              onChange={(event) => setOverwriteOnCopy(event.target.checked)}
            />
            Overwrite target week
          </label>
          <button type="button" onClick={handleQuickCopy} disabled={isSubmitting}>
            Quick copy previous week
          </button>
          <button type="button" onClick={handleDuplicateToNextWeek} disabled={isSubmitting}>
            Duplicate to next week
          </button>
        </div>
      </div>

      {(errorMessage || successMessage) && (
        <div className="planner-feedback">
          {errorMessage ? <p className="error">{errorMessage}</p> : <p className="success">{successMessage}</p>}
        </div>
      )}

      <div className="meal-planner-content">
        <div className="planner-grid-card">
          <div className="planner-grid-head">
            <h3>Weekly meal grid</h3>
            {isLoadingWeek && <span>Refreshing week...</span>}
          </div>

          <div className="planner-grid">
            <div className="corner">Meal Time</div>
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day.date)
              return (
                <div key={dateKey} className="day-head">
                  <p>{day.label}</p>
                  <strong>{toReadableDate(dateKey)}</strong>
                </div>
              )
            })}

            {MEAL_TIMES.map((mealTime) => (
              <Fragment key={mealTime}>
                <div key={`label-${mealTime}`} className="meal-label">
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
                      className={`slot ${meal ? 'filled' : 'empty'}`}
                      onClick={() => (meal ? openEditEditor(meal) : openCreateEditor(dateKey, mealTime))}
                    >
                      {meal ? (
                        <>
                          <strong>{meal.mealName}</strong>
                          <span>{meal.quantity} portions</span>
                          {meal.notes ? <small>{meal.notes}</small> : null}
                        </>
                      ) : (
                        <span>Add meal</span>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <aside className="planner-editor-card">
          <h3>{editor.mode === 'create' ? 'Add meal slot' : 'Edit meal slot'}</h3>
          <p>
            {toReadableDate(editor.date)} - {mealTimeTitle(editor.mealTime)}
          </p>

          <form onSubmit={handleEditorSubmit} className="planner-editor-form">
            <label>
              Date
              <input
                type="date"
                value={editor.date}
                onChange={(event) => setEditor((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>

            <label>
              Meal Time
              <select
                value={editor.mealTime}
                onChange={(event) =>
                  setEditor((prev) => ({ ...prev, mealTime: event.target.value as MealTime }))
                }
              >
                {MEAL_TIMES.map((mealTime) => (
                  <option key={mealTime} value={mealTime}>
                    {mealTimeTitle(mealTime)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Meal name
              <input
                type="text"
                maxLength={120}
                value={editor.mealName}
                onChange={(event) => setEditor((prev) => ({ ...prev, mealName: event.target.value }))}
                placeholder="Ex: Chicken rice bowl"
                required
              />
            </label>

            <label>
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
              />
            </label>

            <label>
              Notes
              <textarea
                maxLength={300}
                rows={3}
                value={editor.notes}
                onChange={(event) => setEditor((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional prep notes"
              />
            </label>

            <div className="editor-actions">
              <button type="submit" disabled={isSubmitting}>
                {editor.mode === 'create' ? 'Save meal' : 'Update meal'}
              </button>
              {editor.mode === 'edit' && (
                <button type="button" className="danger" onClick={handleDelete} disabled={isSubmitting}>
                  Delete
                </button>
              )}
            </div>
          </form>
        </aside>
      </div>

      <section className="month-overview-card">
        <div className="month-overview-head">
          <h3>Monthly overview</h3>
          {isLoadingMonth && <span>Refreshing month...</span>}
        </div>

        {mealsByDate.length === 0 ? (
          <p className="month-empty">No meals planned this month yet.</p>
        ) : (
          <div className="month-rows">
            {mealsByDate.map(([dateKey, meals]) => (
              <article key={dateKey}>
                <h4>{toReadableDate(dateKey)}</h4>
                <div>
                  {meals.map((meal) => (
                    <button key={meal.id} type="button" onClick={() => openEditEditor(meal)}>
                      <strong>{mealTimeTitle(meal.mealTime)}</strong>
                      <span>{meal.mealName}</span>
                      <small>{meal.quantity} portions</small>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <MealPlannerChatbot />
    </section>
  )
}

export default MealPlannerPage
