require('dotenv').config()
require('express-async-errors')

const express = require('express')
const net = require('net')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const { connectDB, getMongoStatus } = require('./src/config/db')

const authRoutes = require('./src/routes/auth.routes')
const adminRoutes = require('./src/routes/admin.routes')
const paymentRoutes = require('./src/routes/payment.routes')
const orderRoutes = require('./src/routes/order.routes')
const mealPlanRoutes = require('./src/routes/mealPlan.routes')
const chatRoutes = require('./src/routes/chat.routes')
const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  const db = getMongoStatus()
  res.status(200).json({
    success: true,
    status: 'ok',
    db,
    timestamp: new Date().toISOString(),
  })
})

const dbCheckMiddleware = (req, res, next) => {
  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas IP access list.',
    })
  }
  next()
}

app.use('/api/auth', dbCheckMiddleware, authRoutes)
app.use('/api/meal-plans', dbCheckMiddleware, mealPlanRoutes)
app.use('/api/chat', dbCheckMiddleware, chatRoutes)


app.use('/api/admin', (req, res, next) => {
  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas IP access list.',
    })
  }
  return next()
}, adminRoutes)

app.use('/api/payments', (req, res, next) => {
  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas IP access list.',
    })
  }
  return next()
}, paymentRoutes)

app.use('/api/orders', (req, res, next) => {
  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable.',
    })
  }
  return next()
}, orderRoutes)

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' })
})

const findAvailablePort = (startPort, maxAttempts = 20) =>
  new Promise((resolve, reject) => {
    let attempts = 0
    let currentPort = startPort

    const tryPort = () => {
      const tester = net.createServer()

      tester.once('error', (error) => {
        tester.close()

        if (error.code === 'EADDRINUSE' && attempts < maxAttempts - 1) {
          attempts += 1
          currentPort += 1
          return tryPort()
        }

        return reject(error)
      })

      tester.once('listening', () => {
        tester.close(() => resolve(currentPort))
      })

      tester.listen(currentPort)
    }

    tryPort()
  })

const start = async () => {
  try {
    await connectDB()
  } catch (error) {
    const allowStartWithoutDb = process.env.ALLOW_START_WITHOUT_DB === 'true' || process.env.NODE_ENV !== 'production'
    if (!allowStartWithoutDb) throw error
    console.warn('[WARN] Starting server without MongoDB connection (development mode).')
    console.warn(`[WARN] ${error.message}`)
  }

  const requestedPort = Number(process.env.PORT) || 5000
  const port = await findAvailablePort(requestedPort)

  if (port !== requestedPort) {
    console.warn(`[WARN] Port ${requestedPort} is busy. Using port ${port} instead.`)
  }

  app.listen(port, () => console.log(`[SERVER] http://localhost:${port}`))
}
start().catch((error) => {
  console.error('[FATAL] Server startup failed', error.message)
  process.exit(1)
})
