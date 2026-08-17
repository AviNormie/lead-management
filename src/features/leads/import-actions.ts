"use server";

import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";
import { computeFullName } from "@/lib/validations/leads";
import { findDuplicateLeads } from "@/lib/leads/duplicates";
import { recordActivity } from "@/lib/leads/activity";
import Papa from "papaparse";

const FIELD_KEYS = [
  "firstName",
  "lastName",
  "company",
  "email",
  "phone",
  "whatsappNumber",
  "city",
  "sourceCode",
] as const;

export type ImportSummary = {
  ok: boolean;
  error?: string;
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
  failedRows: { row: number; reason: string; data: Record<string, string> }[];
};

function mapRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
) {
  const out: Record<string, string> = {};
  for (const key of FIELD_KEYS) {
    const header = mapping[key];
    if (header && row[header] != null) {
      out[key] = String(row[header]).trim();
    }
  }
  return out;
}

export async function importLeadsCsvAction(
  formData: FormData,
): Promise<ImportSummary> {
  try {
    const tenant = await requirePermission("lead.import");
    const file = formData.get("file");
    const mappingRaw = String(formData.get("mapping") ?? "{}");
    if (!(file instanceof File) || file.size === 0) {
      return {
        ok: false,
        error: "CSV file is required",
        totalRows: 0,
        imported: 0,
        duplicates: 0,
        errors: 0,
        failedRows: [],
      };
    }

    const mapping = JSON.parse(mappingRaw) as Record<string, string>;
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const sources = await prisma.leadSource.findMany({
      where: { organizationId: tenant.organizationId },
    });
    const sourceByCode = new Map(sources.map((s) => [s.code.toLowerCase(), s.id]));
    const defaultSource = sources.find((s) => s.code === "import") ?? sources[0];
    const defaultPipeline = await prisma.pipeline.findFirst({
      where: { organizationId: tenant.organizationId, isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    });
    const defaultStage = defaultPipeline?.stages[0];

    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    const failedRows: ImportSummary["failedRows"] = [];

    for (let i = 0; i < parsed.data.length; i += 1) {
      const mapped = mapRow(parsed.data[i], mapping);
      const email = mapped.email?.toLowerCase() || undefined;
      const fullName = computeFullName(mapped);
      if (!fullName || fullName === "Untitled lead") {
        errors += 1;
        failedRows.push({
          row: i + 2,
          reason: "Missing name/company/email",
          data: mapped,
        });
        continue;
      }

      const dupes = await findDuplicateLeads(tenant.organizationId, {
        email,
        phone: mapped.phone,
        whatsappNumber: mapped.whatsappNumber,
        company: mapped.company,
      });
      if (dupes.length > 0) {
        duplicates += 1;
        failedRows.push({
          row: i + 2,
          reason: `Duplicate (${dupes[0].matchedOn.join(", ")})`,
          data: mapped,
        });
        continue;
      }

      const sourceId =
        (mapped.sourceCode &&
          sourceByCode.get(mapped.sourceCode.toLowerCase())) ||
        defaultSource?.id;

      try {
        const lead = await prisma.lead.create({
          data: {
            organizationId: tenant.organizationId,
            firstName: mapped.firstName,
            lastName: mapped.lastName,
            fullName,
            company: mapped.company,
            email,
            phone: mapped.phone,
            whatsappNumber: mapped.whatsappNumber,
            city: mapped.city,
            sourceId,
            pipelineId: defaultPipeline?.id,
            stageId: defaultStage?.id,
          },
        });
        await recordActivity({
          organizationId: tenant.organizationId,
          leadId: lead.id,
          actorId: tenant.userId,
          type: "CREATED",
          message: "Lead imported from CSV",
        });
        imported += 1;
      } catch {
        errors += 1;
        failedRows.push({ row: i + 2, reason: "Insert failed", data: mapped });
      }
    }

    await prisma.importJob.create({
      data: {
        organizationId: tenant.organizationId,
        createdById: tenant.userId,
        status: "COMPLETED",
        filename: file.name,
        totalRows: parsed.data.length,
        imported,
        duplicates,
        errors,
        failedRows,
        completedAt: new Date(),
      },
    });

    return {
      ok: true,
      totalRows: parsed.data.length,
      imported,
      duplicates,
      errors,
      failedRows,
    };
  } catch (error) {
    if (isAppError(error)) {
      return {
        ok: false,
        error: error.message,
        totalRows: 0,
        imported: 0,
        duplicates: 0,
        errors: 0,
        failedRows: [],
      };
    }
    console.error(error);
    return {
      ok: false,
      error: "Import failed",
      totalRows: 0,
      imported: 0,
      duplicates: 0,
      errors: 0,
      failedRows: [],
    };
  }
}

export async function exportLeadsCsvAction() {
  const tenant = await requirePermission("lead.export");
  const leads = await prisma.lead.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    include: { source: true, stage: true, assignedUser: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const csv = Papa.unparse(
    leads.map((lead) => ({
      name: lead.fullName,
      company: lead.company ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source?.name ?? "",
      stage: lead.stage?.name ?? "",
      status: lead.status,
      priority: lead.priority,
      assignedTo: lead.assignedUser?.name ?? lead.assignedUser?.email ?? "",
      score: lead.leadScore,
      createdAt: lead.createdAt.toISOString(),
    })),
  );

  return csv;
}
