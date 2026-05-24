"use client";

import { useState } from "react";
import { FlaskConical, ClipboardCheck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";

interface Inspection {
  id: string;
  inspectionNumber: string;
  date: string;
  batchNumber: string;
  inspectorName: string;
  status: string;
  result: string;
  moisture: number;
  brokenPercentage: number;
  grainLength: number;
}

const inspectionColumns: Column<Inspection>[] = [
  { key: "inspectionNumber", header: "Inspection #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "batchNumber", header: "Batch #" },
  { key: "inspectorName", header: "Inspector" },
  { key: "moisture", header: "Moisture %", render: (item) => `${item.moisture ?? "—"}%` },
  { key: "brokenPercentage", header: "Broken %", render: (item) => `${item.brokenPercentage ?? "—"}%` },
  { key: "result", header: "Result", render: (item) => <Badge variant={item.result === "PASS" ? "default" : item.result === "FAIL" ? "destructive" : "secondary"}>{item.result || "PENDING"}</Badge> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function QualityControlPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ inspectorName: "", batchNumber: "", date: new Date().toISOString().split("T")[0], moisture: "", brokenPercentage: "", grainLength: "" });

  const { data: inspections = [], isLoading } = useApiList<Inspection>(["inspections"], "/quality-control/inspections");
  const createMutation = useApiMutation<Inspection, unknown>("/quality-control/inspections", "post", [["inspections"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Quality Control" description="Inspections, quality certificates, and grading standards" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Inspections" value={inspections.length} icon={FlaskConical} />
        <StatCard title="Passed" value={inspections.filter((i) => i.result === "PASS").length} icon={ClipboardCheck} />
        <StatCard title="Certificates" value="—" icon={Award} />
      </div>

      <Button onClick={() => setShowCreate(true)}>+ New Inspection</Button>
      <DataTable columns={inspectionColumns} data={inspections as unknown as Inspection[]} isLoading={isLoading} emptyMessage="No quality inspections yet." />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Inspection" onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, moisture: Number(form.moisture), brokenPercentage: Number(form.brokenPercentage), grainLength: Number(form.grainLength) }, { onSuccess: () => { setShowCreate(false); setForm({ inspectorName: "", batchNumber: "", date: new Date().toISOString().split("T")[0], moisture: "", brokenPercentage: "", grainLength: "" }); } }); }} isLoading={createMutation.isPending}>
        <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Batch Number</Label><Input value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Inspector Name</Label><Input value={form.inspectorName} onChange={(e) => setForm((p) => ({ ...p, inspectorName: e.target.value }))} required /></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Moisture %</Label><Input type="number" step="0.1" value={form.moisture} onChange={(e) => setForm((p) => ({ ...p, moisture: e.target.value }))} placeholder="0.0" /></div>
          <div className="space-y-2"><Label>Broken %</Label><Input type="number" step="0.1" value={form.brokenPercentage} onChange={(e) => setForm((p) => ({ ...p, brokenPercentage: e.target.value }))} placeholder="0.0" /></div>
          <div className="space-y-2"><Label>Grain Length</Label><Input type="number" step="0.1" value={form.grainLength} onChange={(e) => setForm((p) => ({ ...p, grainLength: e.target.value }))} placeholder="mm" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
