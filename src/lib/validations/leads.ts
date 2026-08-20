import { z } from "zod";
import {
  LeadPriority,
  LeadStatus,
  FollowUpType,
  TaskStatus,
} from "@prisma/client";
import { LOST_REASONS } from "@/lib/leads/lost-reasons";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const phoneDigits = (value: string) => value.replace(/\D/g, "");

const requiredPhone = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .max(40, "Phone must be at most 40 characters")
  .refine((val) => {
    const digits = phoneDigits(val);
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number (7–15 digits)");

const optionalPhone = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val) return true;
    const digits = phoneDigits(val);
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number");

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || z.string().email().safeParse(val).success,
    "Enter a valid email address",
  );

const optionalWebsite = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val) return true;
    try {
      new URL(val.includes("://") ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid website URL");

const optionalScore = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce
    .number({ invalid_type_error: "Score must be a number" })
    .int("Score must be a whole number")
    .min(0, "Score must be between 0 and 100")
    .max(100, "Score must be between 0 and 100")
    .optional(),
);

const optionalMoney = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce
    .number({ invalid_type_error: "Expected value must be a number" })
    .nonnegative("Expected value cannot be negative")
    .optional(),
);

export const leadFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name must be at most 80 characters"),
  lastName: optionalText(80),
  company: optionalText(160),
  email: optionalEmail,
  phone: requiredPhone,
  alternatePhone: optionalPhone,
  whatsappNumber: optionalPhone,
  website: optionalWebsite,
  jobTitle: optionalText(80),
  address: optionalText(300),
  city: optionalText(80),
  state: optionalText(80),
  country: optionalText(80),
  postalCode: optionalText(20),
  industry: optionalText(80),
  companySize: optionalText(40),
  requirement: optionalText(2000),
  productInterest: optionalText(200),
  expectedValue: optionalMoney,
  budget: optionalText(80),
  purchaseTimeline: optionalText(80),
  sourceId: z.string().min(1, "Please select a lead source"),
  sourceDetail: optionalText(200),
  campaign: optionalText(120),
  status: z.nativeEnum(LeadStatus).optional(),
  stageId: z.string().optional().or(z.literal("")),
  pipelineId: z.string().optional().or(z.literal("")),
  priority: z.nativeEnum(LeadPriority).optional(),
  leadScore: optionalScore,
  assignedUserId: z.string().uuid("Invalid assignee").optional().or(z.literal("")),
  assignedTeamId: z.string().optional().or(z.literal("")),
  tags: optionalText(400),
  description: optionalText(5000),
  initialNote: optionalText(8000),
  forceCreate: z.boolean().optional(),
});

export const leadListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  stageId: z.string().optional(),
  sourceId: z.string().optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  assignedUserId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  view: z.enum(["table", "kanban"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["createdAt", "fullName", "leadScore", "nextFollowUpAt"])
    .default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export const noteSchema = z.object({
  content: z.string().min(1).max(8000),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assignedUserId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const followUpSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(FollowUpType).optional(),
  dueAt: z.string().min(1),
  assignedUserId: z.string().uuid().optional().or(z.literal("")),
  priority: z.nativeEnum(LeadPriority).optional(),
});

export const logActivitySchema = z.object({
  kind: z.enum(["CALL", "EMAIL", "MEETING", "WHATSAPP"]),
  notes: z.string().max(4000).optional(),
  occurredAt: z.string().optional(),
  outcome: z.string().max(120).optional(),
  duration: z.string().max(40).optional(),
  subject: z.string().max(200).optional(),
  meetingTitle: z.string().max(200).optional(),
  participants: z.string().max(400).optional(),
});

export const lostReasonSchema = z.object({
  reason: z.enum(LOST_REASONS),
});

export function parseTagNames(value?: string | null) {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
}

export function computeFullName(input: {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email?: string | null;
}) {
  const name = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || input.company || input.email || "Untitled lead";
}
