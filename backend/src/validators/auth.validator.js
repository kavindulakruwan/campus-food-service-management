const { z } = require('zod')

const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string()
              .min(8, 'Min 8 characters')
              .regex(/[A-Z]/, 'Must contain uppercase')
              .regex(/[0-9]/,  'Must contain number'),
}).strict()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password required'),
}).strict()

module.exports = { registerSchema, loginSchema }