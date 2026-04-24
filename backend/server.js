require('dotenv').config()
require('express-async-errors')

const express = require('express')
const net = require('net')
const fs = require('fs')
const path = require('path')
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
const mealItemRoutes = require('./src/routes/mealItem.routes')
const chatRoutes = require('./src/routes/chat.routes')
const userRoutes = require('./src/routes/user.routes')

const app = express()
let reconnectInProgress = false
let reconnectPromise = null

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))
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

const dbCheckMiddleware = async (req, res, next) => {
  if (getMongoStatus().connected) {
    return next()
  }

  try {
    if (!reconnectPromise) {
      reconnectPromise = connectDB().finally(() => {
        reconnectPromise = null
      })
    }

    await reconnectPromise
  } catch (_error) {
    // Handled below by connected check.
  }

  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas IP access list.',
    })
  }

  return next()
}

app.use('/api/auth', dbCheckMiddleware, authRoutes)
app.use('/api/users', dbCheckMiddleware, userRoutes)
app.use('/api/meal-plans', dbCheckMiddleware, mealPlanRoutes)
app.use('/api/meals', dbCheckMiddleware, mealItemRoutes)
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

const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist')
const frontendIndexPath = path.join(frontendBuildPath, 'index.html')

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendBuildPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(frontendIndexPath)
  })
}

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

let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 24 // 24 * 10s = 4 minutes of retries

const startMongoReconnectLoop = () => {
  setInterval(async () => {
    if (getMongoStatus().connected || reconnectInProgress) {
      reconnectAttempts = 0 // Reset on successful connection
      return
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[ERROR] MongoDB reconnect max attempts reached. Manual intervention required.')
      return
    }

    reconnectInProgress = true
    reconnectAttempts += 1
    
    try {
      await connectDB()
      console.log('[INFO] MongoDB reconnected successfully. Attempts reset.')
      reconnectAttempts = 0
    } catch (error) {
      const delayUntilNextAttempt = (MAX_RECONNECT_ATTEMPTS - reconnectAttempts) * 10
      console.warn(`[WARN] MongoDB reconnect failed (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}): ${error.message}. Retrying in 10s... (${delayUntilNextAttempt}s remaining before giving up)`)
    } finally {
      reconnectInProgress = false
    }
  }, 10000) // Reconnect every 10 seconds instead of 15
}

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

  startMongoReconnectLoop()

  app.listen(port, () => console.log(`[SERVER] http://localhost:${port}`))
}
start().catch((error) => {
  console.error('[FATAL] Server startup failed', error.message)
  process.exit(1)
})
