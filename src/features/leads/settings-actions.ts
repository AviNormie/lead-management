"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";

function slugCode(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "source";
}

function revalidateSettings() {
  revalidatePath("/settings/lead-sources");
  revalidatePath("/settings/pipelines");
  revalidatePath("/leads");
}

export async function createLeadSourceAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_sources");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const code = slugCode(String(formData.get("code") ?? name));
    await prisma.leadSource.create({
      data: {
        organizationId: tenant.organizationId,
        name,
        code,
        isActive: true,
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function updateLeadSourceAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_sources");
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const source = await prisma.leadSource.findFirst({
      where: { id, organizationId: tenant.organizationId },
    });
    if (!source) return;
    await prisma.leadSource.update({
      where: { id },
      data: {
        name: name || source.name,
        isActive: formData.get("isActive") !== "false",
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function toggleLeadSourceAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_sources");
    const id = String(formData.get("id") ?? "");
    const source = await prisma.leadSource.findFirst({
      where: { id, organizationId: tenant.organizationId },
    });
    if (!source) return;
    await prisma.leadSource.update({
      where: { id },
      data: { isActive: !source.isActive },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function createPipelineAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_pipeline");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    await prisma.pipeline.create({
      data: {
        organizationId: tenant.organizationId,
        name,
        isActive: true,
        stages: {
          create: [
            { organizationId: tenant.organizationId, name: "New", sortOrder: 0, probability: 10 },
            {
              organizationId: tenant.organizationId,
              name: "Won",
              sortOrder: 1,
              probability: 100,
              isWon: true,
            },
            {
              organizationId: tenant.organizationId,
              name: "Lost",
              sortOrder: 2,
              probability: 0,
              isLost: true,
            },
          ],
        },
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function updatePipelineAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_pipeline");
    const id = String(formData.get("id") ?? "");
    const pipeline = await prisma.pipeline.findFirst({
      where: { id, organizationId: tenant.organizationId },
    });
    if (!pipeline) return;
    const name = String(formData.get("name") ?? "").trim();
    const makeDefault = formData.get("isDefault") === "true";
    if (makeDefault) {
      await prisma.pipeline.updateMany({
        where: { organizationId: tenant.organizationId },
        data: { isDefault: false },
      });
    }
    await prisma.pipeline.update({
      where: { id },
      data: {
        name: name || pipeline.name,
        isActive: formData.get("isActive") !== "false",
        isDefault: makeDefault || pipeline.isDefault,
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function togglePipelineAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_pipeline");
    const id = String(formData.get("id") ?? "");
    const pipeline = await prisma.pipeline.findFirst({
      where: { id, organizationId: tenant.organizationId },
    });
    if (!pipeline) return;
    await prisma.pipeline.update({
      where: { id },
      data: { isActive: !pipeline.isActive },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function addPipelineStageAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_pipeline");
    const pipelineId = String(formData.get("pipelineId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId: tenant.organizationId },
      include: { stages: true },
    });
    if (!pipeline) return;
    const maxOrder = pipeline.stages.reduce((m, s) => Math.max(m, s.sortOrder), -1);
    await prisma.leadStage.create({
      data: {
        organizationId: tenant.organizationId,
        pipelineId,
        name,
        sortOrder: maxOrder + 1,
        probability: Number(formData.get("probability") ?? 0) || 0,
        isWon: formData.get("isWon") === "true",
        isLost: formData.get("isLost") === "true",
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}

export async function updatePipelineStageAction(formData: FormData): Promise<void> {
  try {
    const tenant = await requirePermission("lead.manage_pipeline");
    const id = String(formData.get("id") ?? "");
    const stage = await prisma.leadStage.findFirst({
      where: { id, organizationId: tenant.organizationId },
    });
    if (!stage) return;
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? stage.sortOrder);
    await prisma.leadStage.update({
      where: { id },
      data: {
        name: name || stage.name,
        probability: Number(formData.get("probability") ?? stage.probability),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : stage.sortOrder,
        isWon: formData.get("isWon") === "true",
        isLost: formData.get("isLost") === "true",
      },
    });
    revalidateSettings();
  } catch (error) {
    if (!isAppError(error)) console.error(error);
  }
}
