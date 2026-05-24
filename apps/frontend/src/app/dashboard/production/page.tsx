"use client";

import { useState } from "react";
import { Factory, Layers, ClipboardList, Settings } from "lucide-react";
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

interface Batch { id: string; batchNumber: string; date: string; status: string; inputWeight: number; totalOutput: number; recoveryPercentage: number; }
interface MillingRecord { id: string; batchId: string; outputType: string; weight: number; brokenRatio: number; }
interface ProductionPlan { id: string; planNumber: string; date: string; shift: string; status: string; }

const batchColumns: Column<Batch>[] = [
  { key: "batchNumber", header: "Batch #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : item.status === "IN_PROGRESS" ? "secondary" : "outline"}>{item.status}</Badge> },
  { key: "inputWeight", header: "Input (kg)" },
  { key: "totalOutput", header: "Output (kg)" },
  { key: "recoveryPercentage", header: "Recovery %", render: (item) => `${item.recoveryPercentage?.toFixed(1) ?? "—"}%` },
];

const millingColumns: Column<MillingRecord>[] = [
  { key: "outputType", header: "Output Type" },
  { key: "weight", header: "Weight (kg)" },
  { key: "brokenRatio", header: "Broken Ratio", render: (item) => `${item.brokenRatio}%` },
];

const planColumns: Column<ProductionPlan>[] = [
  { key: "planNumber", header: "Plan #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "shift", header: "Shift" },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function ProductionPage() {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ inputWeight: "", date: new Date().toISOString().split("T")[0] });

  const { data: batches = [], isLoading: batchLoading } = useApiList<Batch>(["batches"], "/production/batches");
  const { data: millingRecords = [], isLoading: millLoading } = useApiList<MillingRecord>(["milling"], "/production/milling-records");
  const { data: plans = [], isLoading: planLoading } = useApiList<ProductionPlan>(["plans"], "/production/plans");

  const createBatchMutation = useApiMutation<Batch, unknown>("/production/batches", "post", [["batches"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Production Management" description="Milling batches, production plans, and yield tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Batches" value={batches.length} icon={Layers} description={`${batches.filter((b) => b.status === "IN_PROGRESS").length} in progress`} />
        <StatCard title="Milling Records" value={millingRecords.length} icon={Factory} />
        <StatCard title="Production Plans" value={plans.length} icon={ClipboardList} />
        <StatCard title="Machines" value="—" icon={Settings} />
      </div>

      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches"><Layers className="mr-2 size-4" />Batches</TabsTrigger>
          <TabsTrigger value="milling"><Factory className="mr-2 size-4" />Milling Records</TabsTrigger>
          <TabsTrigger value="plans"><ClipboardList className="mr-2 size-4" />Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="batches" className="space-y-4">
          <Button onClick={() => setShowCreateBatch(true)}>+ New Batch</Button>
          <DataTable columns={batchColumns} data={batches as unknown as Batch[]} isLoading={batchLoading} />
        </TabsContent>
        <TabsContent value="milling" className="space-y-4">
          <DataTable columns={millingColumns} data={millingRecords as unknown as MillingRecord[]} isLoading={millLoading} />
        </TabsContent>
        <TabsContent value="plans" className="space-y-4">
          <DataTable columns={planColumns} data={plans as unknown as ProductionPlan[]} isLoading={planLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateBatch} onOpenChange={setShowCreateBatch} title="Create Batch" onSubmit={(e) => { e.preventDefault(); createBatchMutation.mutate({ inputWeight: Number(batchForm.inputWeight), date: batchForm.date }, { onSuccess: () => { setShowCreateBatch(false); setBatchForm({ inputWeight: "", date: new Date().toISOString().split("T")[0] }); } }); }} isLoading={createBatchMutation.isPending}>
        <div className="space-y-2"><Label>Date</Label><Input type="date" value={batchForm.date} onChange={(e) => setBatchForm((p) => ({ ...p, date: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Input Weight (kg)</Label><Input type="number" value={batchForm.inputWeight} onChange={(e) => setBatchForm((p) => ({ ...p, inputWeight: e.target.value }))} required placeholder="0" /></div>
      </FormDialog>
    </div>
  );
}
