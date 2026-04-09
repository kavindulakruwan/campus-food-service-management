const MealPlan = require('../models/MealPlan')

const parseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const toDateKey = (date) => {
  const iso = new Date(date).toISOString()
  return iso.slice(0, 10)
}

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addDays = (date, days) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const normalizeWeekStart = (input) => {
  if (input) return parseDate(input)

  const today = new Date()
  const day = today.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  return startOfUtcDay(addDays(today, diffToMonday))
}

const serializeMeal = (item) => ({
  id: item._id,
  date: toDateKey(item.date),
  mealTime: item.mealTime,
  mealName: item.mealName,
  quantity: item.quantity,
  notes: item.notes || '',
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

exports.createMealPlan = async (req, res) => {
  const userId = req.user.id
  const { date, mealTime, mealName, quantity, notes } = req.body

  try {
    const created = await MealPlan.create({
      user: userId,
      date: parseDate(date),
      mealTime,
      mealName,
      quantity,
      notes: notes || '',
    })

    return res.status(201).json({
      success: true,
      message: 'Meal plan created',
      data: serializeMeal(created),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A meal already exists for this date and meal time',
      })
    }
    throw error
  }
}

exports.getWeeklyMealPlans = async (req, res) => {
  const userId = req.user.id
  const weekStart = normalizeWeekStart(req.query.startDate)
  const weekEnd = addDays(weekStart, 7)

  const plans = await MealPlan.find({
    user: userId,
    date: { $gte: weekStart, $lt: weekEnd },
  }).sort({ date: 1, mealTime: 1 })

  res.json({
    success: true,
    data: {
      weekStart: toDateKey(weekStart),
      weekEnd: toDateKey(addDays(weekEnd, -1)),
      plans: plans.map(serializeMeal),
    },
  })
}

exports.getMonthlyMealPlans = async (req, res) => {
  const userId = req.user.id
  const now = new Date()
  const year = Number(req.query.year || now.getUTCFullYear())
  const month = Number(req.query.month || now.getUTCMonth() + 1)

  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const nextMonthStart = new Date(Date.UTC(year, month, 1))

  const plans = await MealPlan.find({
    user: userId,
    date: { $gte: monthStart, $lt: nextMonthStart },
  }).sort({ date: 1, mealTime: 1 })

  res.json({
    success: true,
    data: {
      year,
      month,
      plans: plans.map(serializeMeal),
    },
  })
}

exports.updateMealPlan = async (req, res) => {
  const userId = req.user.id
  const { id } = req.params
  const payload = { ...req.body }

  if (payload.date) {
    payload.date = parseDate(payload.date)
  }

  try {
    const updated = await MealPlan.findOneAndUpdate(
      { _id: id, user: userId },
      payload,
      { new: true, runValidators: true },
    )

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' })
    }

    return res.json({
      success: true,
      message: 'Meal plan updated',
      data: serializeMeal(updated),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Another meal already exists for this date and meal time',
      })
    }
    throw error
  }
}

exports.deleteMealPlan = async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  const deleted = await MealPlan.findOneAndDelete({ _id: id, user: userId })
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Meal plan not found' })
  }

  return res.json({ success: true, message: 'Meal plan deleted' })
}

const duplicateWeek = async ({ userId, sourceWeekStart, targetWeekStart, overwrite }) => {
  const sourceStart = parseDate(sourceWeekStart)
  const sourceEnd = addDays(sourceStart, 7)
  const targetStart = parseDate(targetWeekStart)
  const targetEnd = addDays(targetStart, 7)

  const sourcePlans = await MealPlan.find({
    user: userId,
    date: { $gte: sourceStart, $lt: sourceEnd },
  }).lean()

  if (sourcePlans.length === 0) {
    return { copiedCount: 0 }
  }

  if (overwrite) {
    await MealPlan.deleteMany({
      user: userId,
      date: { $gte: targetStart, $lt: targetEnd },
    })
  }

  const targetExisting = await MealPlan.find({
    user: userId,
    date: { $gte: targetStart, $lt: targetEnd },
  }).lean()

  const existingKeys = new Set(
    targetExisting.map((item) => `${toDateKey(item.date)}-${item.mealTime}`),
  )

  const docs = sourcePlans
    .map((item) => {
      const dayOffset = Math.floor((new Date(item.date).getTime() - sourceStart.getTime()) / 86400000)
      const date = addDays(targetStart, dayOffset)
      const key = `${toDateKey(date)}-${item.mealTime}`

      if (existingKeys.has(key)) {
        return null
      }

      existingKeys.add(key)

      return {
        user: userId,
        date,
        mealTime: item.mealTime,
        mealName: item.mealName,
        quantity: item.quantity,
        notes: item.notes || '',
      }
    })
    .filter(Boolean)

  if (docs.length > 0) {
    await MealPlan.insertMany(docs)
  }

  return { copiedCount: docs.length }
}

exports.duplicateWeekPlans = async (req, res) => {
  const userId = req.user.id
  const { sourceWeekStart, targetWeekStart, overwrite = false } = req.body

  const result = await duplicateWeek({ userId, sourceWeekStart, targetWeekStart, overwrite })

  res.json({
    success: true,
    message: 'Week duplicated',
    data: result,
  })
}

exports.quickCopyWeekPlans = async (req, res) => {
  const userId = req.user.id
  const { targetWeekStart, strategy = 'previous-week', overwrite = false } = req.body
  const targetStart = parseDate(targetWeekStart)
  const sourceStart = strategy === 'next-week' ? addDays(targetStart, 7) : addDays(targetStart, -7)

  const result = await duplicateWeek({
    userId,
    sourceWeekStart: toDateKey(sourceStart),
    targetWeekStart,
    overwrite,
  })

  res.json({
    success: true,
    message: 'Quick copy completed',
    data: result,
  })
}
