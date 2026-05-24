"use client";

import { FlaskConical, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";

interface Inspection { id: string; inspectionNumber: string; batchNumber: string; date: string; moisturePercent: number; brokenPercent: number; gradeAPercent: number; status: string; result: string; }

const inspectionColumns: Column<Inspection>[] = [
  { key: "inspectionNumber", header: "Inspection #", render: (item) => <span className="font-mono font-medium text-primary">{item.inspectionNumber}</span> },
  { key: "batchNumber", header: "Batch" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "moisturePercent", header: "Moisture %", className: "text-right", render: (item) => <span className="font-mono">{item.moisturePercent?.toFixed(1)}%</span> },
  { key: "brokenPercent", header: "Broken %", className: "text-right", render: (item) => <span className="font-mono">{item.brokenPercent?.toFixed(1)}%</span> },
  { key: "gradeAPercent", header: "Grade A %", className: "text-right", render: (item) => <span className="font-mono font-semibold">{item.gradeAPercent?.toFixed(1)}%</span> },
  {
    key: "result",
    header: "Result",
    render: (item) => {
      const colors: Record<string, string> = { PASS: "bg-emerald-600", FAIL: "bg-red-600", CONDITIONAL: "bg-amber-600" };
      return <Badge variant={item.result === "PASS" ? "default" : "destructive"} className={colors[item.result] ?? ""}>{item.result}</Badge>;
    },
  },
];

export default function QualityControlPage() {
  const { data: inspections = [], isLoading } = useApiList<Inspection>(["inspections"], "/quality-control/inspections");

  return (
    <div className="space-y-6">
      <PageHeader title="Quality Control" description="Inspections, moisture analysis, grain grading, and quality certificates" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Inspections" value={inspections.length} icon={FlaskConical} />
        <StatCard title="Passed" value={inspections.filter((i) => i.result === "PASS").length} icon={CheckCircle2} />
        <StatCard title="Failed" value={inspections.filter((i) => i.result === "FAIL").length} icon={AlertTriangle} />
      </div>

      <DataTable columns={inspectionColumns} data={inspections as unknown as Inspection[]} isLoading={isLoading} emptyMessage="No quality inspections yet." searchPlaceholder="Search inspections..." />
    </div>
  );
}
