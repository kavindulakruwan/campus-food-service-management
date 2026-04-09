const { z } = require('zod')

const passwordSchema = z.string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain number')

const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(['student', 'admin']).optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  role: z.enum(['student', 'admin']).optional(),
  phoneNumber: z.string().max(30).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
})

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})

module.exports = {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  updateUserStatusSchema,
}