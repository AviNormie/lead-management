"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { updateLeadAction } from "@/features/leads/actions";
import { saveLeadCustomFieldsAction } from "@/features/leads/custom-field-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeadPriority } from "@prisma/client";

type CustomFieldDef = {
  id: string;
  key: string;
  label: string;
  type: string;
  section: string;
  options: unknown;
};

type LeadDialLead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  sourceId: string | null;
  stageId: string | null;
  pipelineId: string | null;
  priority: string;
  callbackAt: string | null;
  nextFollowUpAt: string | null;
  customFieldValues: {
    fieldId: string;
    value: string | null;
    field: CustomFieldDef;
  }[];
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

function toFormData(lead: LeadDialLead, form: HTMLFormElement) {
  const fd = new FormData(form);
  fd.set("leadId", lead.id);
  fd.set("firstName", lead.firstName ?? lead.company ?? "Lead");
  if (lead.lastName) fd.set("lastName", lead.lastName);
  if (lead.sourceId) fd.set("sourceId", lead.sourceId);
  if (lead.pipelineId) fd.set("pipelineId", lead.pipelineId);
  return fd;
}

export function LeadDialUpdateDialog({
  lead,
  stages,
  customFields,
  open,
  onOpenChange,
}: {
  lead: LeadDialLead;
  stages: { id: string; name: string }[];
  customFields: CustomFieldDef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const tel = lead.phone ? `tel:${lead.phone}` : null;

  const valueByKey = Object.fromEntries(
    lead.customFieldValues.map((row) => [row.field.key, row.value ?? ""]),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = e.currentTarget;
    const fd = toFormData(lead, form);

    const result = await updateLeadAction(null, fd);
    if (!result.ok) {
      setPending(false);
      toast.error(result.error);
      return;
    }

    const customValues: Record<string, string> = {};
    for (const field of customFields) {
      const input = form.elements.namedItem(`cf_${field.key}`);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
        customValues[field.key] = input.value;
      }
    }
    await saveLeadCustomFieldsAction(lead.id, customValues);

    setPending(false);
    toast.success("Lead updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto">
        <DialogTitle>Update lead</DialogTitle>
        <DialogDescription>
          Quick update while contacting this lead.
        </DialogDescription>

        {tel ? (
          <a href={tel} className="mt-3 inline-flex">
            <Button size="sm" variant="secondary" type="button">
              <Phone className="h-3.5 w-3.5" />
              Call {lead.phone}
            </Button>
          </a>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <section className="space-y-3">
            <h4 className="text-sm font-semibold">Contact</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dial-phone">Phone</Label>
                <Input id="dial-phone" name="phone" defaultValue={lead.phone ?? ""} required />
              </div>
              <div>
                <Label htmlFor="dial-email">Email</Label>
                <Input id="dial-email" name="email" type="email" defaultValue={lead.email ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="dial-whatsapp">WhatsApp</Label>
                <Input id="dial-whatsapp" name="whatsappNumber" defaultValue={lead.whatsappNumber ?? ""} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold">CRM</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dial-stage">Stage</Label>
                <Select id="dial-stage" name="stageId" defaultValue={lead.stageId ?? ""}>
                  <option value="">No stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="dial-priority">Priority</Label>
                <Select id="dial-priority" name="priority" defaultValue={lead.priority}>
                  {(["LOW", "MEDIUM", "HIGH", "URGENT"] as LeadPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="dial-follow-up">Next follow-up</Label>
                <Input
                  id="dial-follow-up"
                  name="nextFollowUpAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(lead.nextFollowUpAt)}
                />
              </div>
              <div>
                <Label htmlFor="dial-callback">Callback</Label>
                <Input
                  id="dial-callback"
                  name="callbackAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(lead.callbackAt)}
                />
              </div>
            </div>
          </section>

          {customFields.length > 0 ? (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold">Custom fields</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {customFields.map((field) => {
                  const options = Array.isArray(field.options)
                    ? (field.options as string[])
                    : null;
                  const defaultValue = valueByKey[field.key] ?? "";
                  return (
                    <div key={field.id} className={field.type === "TEXTAREA" ? "sm:col-span-2" : undefined}>
                      <Label htmlFor={`cf-${field.key}`}>{field.label}</Label>
                      {field.type === "TEXTAREA" ? (
                        <Textarea
                          id={`cf-${field.key}`}
                          name={`cf_${field.key}`}
                          rows={2}
                          defaultValue={defaultValue}
                        />
                      ) : field.type === "SELECT" && options ? (
                        <Select id={`cf-${field.key}`} name={`cf_${field.key}`} defaultValue={defaultValue}>
                          <option value="">—</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={`cf-${field.key}`}
                          name={`cf_${field.key}`}
                          type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                          defaultValue={defaultValue}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
