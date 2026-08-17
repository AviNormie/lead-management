import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  industry: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  currency: z.string().min(3).max(3).default("USD"),
  timezone: z.string().min(1).max(64).default("UTC"),
  contactEmail: z
    .string()
    .email("Invalid contact email")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().max(40).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  roleId: z.string().min(1, "Role is required"),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(8).max(128).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  industry: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().min(1).max(64).optional(),
  contactEmail: z
    .string()
    .email()
    .optional()
    .nullable()
    .or(z.literal("")),
  contactPhone: z.string().max(40).optional().nullable(),
});

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
