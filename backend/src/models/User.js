const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name too long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Minimum 8 characters'],
    select: false,          // NEVER returned in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Hash password before every save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Instance method to compare passwords on login
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)