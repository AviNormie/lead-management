"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importLeadsCsvAction, type ImportSummary } from "@/features/leads/import-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const TARGETS = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "alternatePhone", label: "Alternate phone" },
  { key: "whatsappNumber", label: "WhatsApp" },
  { key: "website", label: "Website" },
  { key: "jobTitle", label: "Job title" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "postalCode", label: "Postal code" },
  { key: "industry", label: "Industry" },
  { key: "sourceCode", label: "Source code" },
  { key: "description", label: "Description" },
] as const;

export function ImportWizard() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [pending, setPending] = useState(false);

  function onFile(next: File | null) {
    setFile(next);
    setResult(null);
    if (!next) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const cols = parsed.meta.fields ?? [];
      setHeaders(cols);
      setPreview(parsed.data.slice(0, 5));
      const auto: Record<string, string> = {};
      for (const target of TARGETS) {
        const match = cols.find(
          (c) => c.toLowerCase().replace(/\s+/g, "") === target.key.toLowerCase(),
        );
        if (match) auto[target.key] = match;
      }
      setMapping(auto);
    };
    reader.readAsText(next);
  }

  async function onImport() {
    if (!file) return;
    setPending(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("mapping", JSON.stringify(mapping));
    const summary = await importLeadsCsvAction(fd);
    setResult(summary);
    setPending(false);
  }

  function downloadFailed() {
    if (!result?.failedRows.length) return;
    const csv = Papa.unparse(result.failedRows.map((r) => ({ row: r.row, reason: r.reason, ...r.data })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-failed-rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="csv">CSV file</Label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block text-sm"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {headers.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Column mapping</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {TARGETS.map((target) => (
              <label key={target.key} className="text-sm">
                {target.label}
                <select
                  className="mt-1 flex h-10 w-full rounded-xl border border-[var(--ic-border)] px-3 text-sm"
                  value={mapping[target.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [target.key]: e.target.value }))
                  }
                >
                  <option value="">Ignore</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {preview.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Preview (first 5 rows)</h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="border-b px-2 py-1 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h} className="border-b px-2 py-1">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Button type="button" disabled={!file || pending} onClick={() => void onImport()}>
        {pending ? "Importing…" : "Import leads"}
      </Button>

      {result ? (
        <div className="rounded-xl bg-[var(--ic-surface-muted)] p-4 text-sm">
          <p>Total rows: {result.totalRows}</p>
          <p>Imported: {result.imported}</p>
          <p>Duplicates: {result.duplicates}</p>
          <p>Errors: {result.errors}</p>
          {result.error ? <p className="text-danger">{result.error}</p> : null}
          {result.failedRows.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={downloadFailed}
            >
              Download failed rows
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
