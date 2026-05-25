"use client";

import { useState } from "react";
import { Factory, Layers, ClipboardList, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Batch { id: string; batchNumber: string; date: string; status: string; inputWeight: number; outputWeight: number; recoveryPercent: number; }
interface MillingRecord { id: string; batchId: string; brokenPercent: number; recovery: number; createdAt: string; }
interface ProductionPlan { id: string; planNumber: string; date: string; shift: string; status: string; }

const batchColumns: Column<Batch>[] = [
  { key: "batchNumber", header: "Batch #", render: (item) => <span className="font-mono font-medium text-primary">{item.batchNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "inputWeight", header: "Input (kg)", className: "text-right", render: (item) => <span className="font-mono">{item.inputWeight?.toLocaleString()}</span> },
  { key: "outputWeight", header: "Output (kg)", className: "text-right", render: (item) => <span className="font-mono">{item.outputWeight?.toLocaleString()}</span> },
  { key: "recoveryPercent", header: "Recovery %", className: "text-right", render: (item) => <span className="font-mono font-semibold">{item.recoveryPercent?.toFixed(1)}%</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { PENDING: "", IN_PROGRESS: "bg-blue-600", COMPLETED: "bg-emerald-600", CANCELLED: "bg-red-600" };
      return <Badge variant={item.status === "PENDING" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const planColumns: Column<ProductionPlan>[] = [
  { key: "planNumber", header: "Plan #", render: (item) => <span className="font-mono font-medium">{item.planNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "shift", header: "Shift", render: (item) => <Badge variant="outline">{item.shift}</Badge> },
  {
    key: "status",
    header: "Status",
    render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"} className={item.status === "COMPLETED" ? "bg-emerald-600" : ""}>{item.status}</Badge>,
  },
];

export default function ProductionPage() {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ date: todayISO(), inputWeight: "" });

  const { data: batches = [], isLoading: batchLoading } = useApiList<Batch>(["batches"], "/production/batches");
  const { data: plans = [], isLoading: planLoading } = useApiList<ProductionPlan>(["production-plans"], "/production/plans");

  const createBatchMutation = useApiMutation<Batch, unknown>("/production/batches", "post", [["batches"]]);

  const avgRecovery = batches.length > 0 ? (batches.reduce((s, b) => s + (b.recoveryPercent || 0), 0) / batches.length).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Production & Milling" description="Manage production batches, milling records, and production plans" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Batches" value={batches.length} icon={Layers} description={`${batches.filter((b) => b.status === "IN_PROGRESS").length} in progress`} />
        <StatCard title="Production Plans" value={plans.length} icon={ClipboardList} />
        <StatCard title="Avg Recovery" value={`${avgRecovery}%`} icon={Factory} description="Paddy to rice" />
        <StatCard title="Completed" value={batches.filter((b) => b.status === "COMPLETED").length} icon={Factory} />
      </div>

      <Tabs defaultValue="batches">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="batches" className="gap-1.5"><Layers className="size-3.5" />Batches</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5"><ClipboardList className="size-3.5" />Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4 mt-4">
          <DataTable
            columns={batchColumns}
            data={batches as unknown as Batch[]}
            isLoading={batchLoading}
            emptyMessage="No production batches yet."
            searchPlaceholder="Search batches..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateBatch(true)}>
                <Plus className="size-3.5" />
                New Batch
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4 mt-4">
          <DataTable columns={planColumns} data={plans as unknown as ProductionPlan[]} isLoading={planLoading} emptyMessage="No production plans yet." searchPlaceholder="Search plans..." />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateBatch}
        onOpenChange={setShowCreateBatch}
        title="Create Production Batch"
        description={`Batch # ${generateNumber("batch", batches.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createBatchMutation.mutate({ ...batchForm, inputWeight: Number(batchForm.inputWeight) }, {
            onSuccess: () => { setShowCreateBatch(false); toast.success("Batch created"); setBatchForm({ date: todayISO(), inputWeight: "" }); },
          });
        }}
        isLoading={createBatchMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
            <Input type="date" value={batchForm.date} onChange={(e) => setBatchForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Input Weight (kg)</Label>
            <Input type="number" min="0" value={batchForm.inputWeight} onChange={(e) => setBatchForm((p) => ({ ...p, inputWeight: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
