const { z } = require('zod')

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  phoneNumber: z.string().max(30).optional(),
  bio: z.string().max(300).optional(),
})

module.exports = { updateProfileSchema }