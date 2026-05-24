"use client";

import { useState } from "react";
import { FlaskConical, CheckCircle2, AlertTriangle, Plus, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate, todayISO } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Inspection { id: string; inspectionNumber: string; batchNumber: string; date: string; moisturePercent: number; brokenPercent: number; gradeAPercent: number; status: string; result: string; inspectorName: string; remarks: string; }

const inspectionColumns: Column<Inspection>[] = [
  { key: "inspectionNumber", header: "Inspection #", render: (item) => <span className="font-mono font-medium text-primary">{item.inspectionNumber}</span> },
  { key: "batchNumber", header: "Batch" },
  { key: "inspectorName", header: "Inspector", render: (item) => item.inspectorName ?? "—" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "moisturePercent", header: "Moisture %", className: "text-right", render: (item) => <span className={`font-mono ${(item.moisturePercent ?? 0) > 14 ? "text-red-600 font-semibold" : ""}`}>{item.moisturePercent?.toFixed(1)}%</span> },
  { key: "brokenPercent", header: "Broken %", className: "text-right", render: (item) => <span className={`font-mono ${(item.brokenPercent ?? 0) > 5 ? "text-amber-600" : ""}`}>{item.brokenPercent?.toFixed(1)}%</span> },
  { key: "gradeAPercent", header: "Grade A %", className: "text-right", render: (item) => <span className="font-mono font-semibold">{item.gradeAPercent?.toFixed(1)}%</span> },
  {
    key: "result", header: "Result", render: (item) => {
      const colors: Record<string, string> = { PASS: "bg-emerald-600", FAIL: "bg-red-600", CONDITIONAL: "bg-amber-600" };
      return <Badge variant={item.result === "PASS" ? "default" : "destructive"} className={colors[item.result] ?? ""}>{item.result}</Badge>;
    },
  },
];

export default function QualityControlPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ batchNumber: "", date: todayISO(), moisturePercent: 0, brokenPercent: 0, gradeAPercent: 0, inspectorName: "", remarks: "" });

  const { data: inspections = [], isLoading } = useApiList<Inspection>(["inspections"], "/quality-control/inspections");
  const createMutation = useApiMutation("/quality-control/inspections", "post", [["inspections"]]);

  const passed = inspections.filter((i) => i.result === "PASS").length;
  const failed = inspections.filter((i) => i.result === "FAIL").length;
  const avgMoisture = inspections.length > 0 ? inspections.reduce((s, i) => s + Number(i.moisturePercent || 0), 0) / inspections.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Quality Control" description="Inspections, moisture analysis, grain grading, and quality certificates" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Inspections" value={inspections.length} icon={FlaskConical} />
        <StatCard title="Passed" value={passed} icon={CheckCircle2} description={inspections.length > 0 ? `${((passed / inspections.length) * 100).toFixed(0)}% pass rate` : ""} />
        <StatCard title="Failed" value={failed} icon={AlertTriangle} />
        <StatCard title="Avg Moisture" value={`${avgMoisture.toFixed(1)}%`} icon={Beaker} description={avgMoisture > 14 ? "Above standard" : "Within standard"} />
      </div>

      <DataTable columns={inspectionColumns} data={inspections as unknown as Inspection[]} isLoading={isLoading} emptyMessage="No quality inspections yet." searchPlaceholder="Search inspections..."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Inspection</Button>} />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Quality Inspection"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Inspection created"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Batch Number</Label><Input value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} required className="font-mono" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Moisture %</Label><Input type="number" step="0.1" value={form.moisturePercent || ""} onChange={(e) => setForm((p) => ({ ...p, moisturePercent: Number(e.target.value) }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Broken %</Label><Input type="number" step="0.1" value={form.brokenPercent || ""} onChange={(e) => setForm((p) => ({ ...p, brokenPercent: Number(e.target.value) }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Grade A %</Label><Input type="number" step="0.1" value={form.gradeAPercent || ""} onChange={(e) => setForm((p) => ({ ...p, gradeAPercent: Number(e.target.value) }))} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Inspector</Label><Input value={form.inspectorName} onChange={(e) => setForm((p) => ({ ...p, inspectorName: e.target.value }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Remarks</Label><Input value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
