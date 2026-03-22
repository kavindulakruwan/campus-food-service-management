require('dotenv').config()
require('express-async-errors')

const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const cookieParser = require('cookie-parser')
const { connectDB, getMongoStatus } = require('./src/config/db')
const authRoutes = require('./src/routes/auth.routes')

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

app.use('/api/auth', (req, res, next) => {
  if (!getMongoStatus().connected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas IP access list.',
    })
  }
  next()
}, authRoutes)

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' })
})

const start = async () => {
  try {
    await connectDB()
  } catch (error) {
    const allowStartWithoutDb =
      process.env.ALLOW_START_WITHOUT_DB === 'true' || process.env.NODE_ENV !== 'production'

    if (!allowStartWithoutDb) {
      throw error
    }

    console.warn('[WARN] Starting server without MongoDB connection (development mode).')
    console.warn(`[WARN] ${error.message}`)
  }

  app.listen(process.env.PORT || 5000, () =>
    console.log(`[SERVER] http://localhost:${process.env.PORT || 5000}`)
  )
}
start().catch((error) => {
  console.error('[FATAL] Server startup failed')
  console.error(error.message)
  process.exit(1)
})
