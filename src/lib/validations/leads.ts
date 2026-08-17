import { z } from "zod";
import { LeadPriority, LeadStatus, FollowUpType, TaskStatus } from "@prisma/client";

export const leadFormSchema = z.object({
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  company: z.string().max(160).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  alternatePhone: z.string().max(40).optional(),
  whatsappNumber: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  industry: z.string().max(80).optional(),
  jobTitle: z.string().max(80).optional(),
  companySize: z.string().max(40).optional(),
  requirement: z.string().max(2000).optional(),
  productInterest: z.string().max(200).optional(),
  expectedValue: z.coerce.number().nonnegative().optional(),
  budget: z.string().max(80).optional(),
  purchaseTimeline: z.string().max(80).optional(),
  sourceId: z.string().optional(),
  sourceDetail: z.string().max(200).optional(),
  campaign: z.string().max(120).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  stageId: z.string().optional(),
  pipelineId: z.string().optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  assignedUserId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(5000).optional(),
  forceCreate: z.boolean().optional(),
});

export const leadListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  stageId: z.string().optional(),
  sourceId: z.string().optional(),
  assignedUserId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "fullName", "leadScore", "nextFollowUpAt"]).default("createdAt"),
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

export function computeFullName(input: {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email?: string | null;
}) {
  const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  return name || input.company || input.email || "Untitled lead";
}
