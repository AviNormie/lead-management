"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportLeadsCsvAction } from "@/features/leads/import-actions";

export function ExportLeadsButton() {
  async function onExport() {
    const csv = await exportLeadsCsvAction();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => void onExport()}>
      <Download className="h-3.5 w-3.5" />
      Export
    </Button>
  );
}
