import { LeadPriority, LeadStatus } from "@prisma/client";
import { z } from "zod";

export const dialUpdateSchema = z.object({
  leadId: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "Mobile number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  stageId: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  nextFollowUpAt: z.string().optional(),
  callbackAt: z.string().optional(),
  comments: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

export type DialUpdateInput = z.infer<typeof dialUpdateSchema>;

export function parseDialUpdateDate(value: string | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
