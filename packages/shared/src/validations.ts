import { z } from 'zod'

// Basic validation schemas
export const emailSchema = z.string().email()
export const passwordSchema = z.string().min(6)