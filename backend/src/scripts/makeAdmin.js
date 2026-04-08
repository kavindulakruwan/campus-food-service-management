require('dotenv').config()

const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const User = require('../models/User')

const run = async () => {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npm run make-admin -- user@example.com')
    process.exit(1)
  }

  try {
    await connectDB()

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true },
    )

    if (!user) {
      console.error(`User not found: ${email}`)
      process.exitCode = 1
      return
    }

    console.log(`Success: ${user.email} is now an admin.`)
  } catch (error) {
    console.error(`Failed to promote admin: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

run()
