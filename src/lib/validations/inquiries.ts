import { z } from "zod";
import { InquiryStatus, LeadPriority } from "@prisma/client";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || z.string().email().safeParse(val).success,
    "Enter a valid email address",
  );

const optionalPhone = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val) return true;
    const digits = val.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number");

export const inquiryFormSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  description: optionalText(5000),
  contactName: z.string().trim().min(1, "Contact name is required").max(120),
  email: optionalEmail,
  phone: optionalPhone,
  status: z.nativeEnum(InquiryStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  assignedUserId: optionalText(64),
  linkedLeadId: optionalText(64),
  source: optionalText(120),
});

export const inquiryListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.nativeEnum(InquiryStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  assignedUserId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["createdAt", "subject", "status", "priority"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
