import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your name').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const activateLicenseSchema = z.object({
  licenseKey: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/, 'Invalid license key format'),
  deviceName: z.string().min(1, 'Device name is required').max(60),
});
export type ActivateLicenseInput = z.infer<typeof activateLicenseSchema>;

export const generateLicenseSchema = z.object({
  type: z.enum(['7d', '30d', '90d', 'lifetime']),
  quantity: z.number().int().min(1).max(1000),
  deviceLimit: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(200).optional(),
});
