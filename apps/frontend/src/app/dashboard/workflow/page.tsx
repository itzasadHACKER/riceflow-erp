"use client";

import { useState } from "react";
import { GitBranch, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";

interface WorkflowDef { id: string; name: string; entityType: string; isActive: boolean; createdAt: string; }
interface WorkflowInstance { id: string; definitionId: string; entityId: string; status: string; currentStep: number; createdAt: string; }

const defColumns: Column<WorkflowDef>[] = [
  { key: "name", header: "Name" },
  { key: "entityType", header: "Entity Type", render: (item) => <Badge variant="outline">{item.entityType}</Badge> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
  { key: "createdAt", header: "Created", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

const instColumns: Column<WorkflowInstance>[] = [
  { key: "entityId", header: "Entity ID" },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : item.status === "REJECTED" ? "destructive" : "secondary"}>{item.status}</Badge> },
  { key: "currentStep", header: "Step" },
  { key: "createdAt", header: "Started", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

export default function WorkflowPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", entityType: "PURCHASE_ORDER" });

  const { data: definitions = [], isLoading: defLoading } = useApiList<WorkflowDef>(["workflow-defs"], "/workflow/definitions");
  const { data: instances = [], isLoading: instLoading } = useApiList<WorkflowInstance>(["workflow-instances"], "/workflow/pending");

  const createMutation = useApiMutation<WorkflowDef, unknown>("/workflow/definitions", "post", [["workflow-defs"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Engine" description="Approval workflows, multi-stage approvals, and automation" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Definitions" value={definitions.length} icon={GitBranch} />
        <StatCard title="Pending" value={instances.filter((i) => i.status === "PENDING").length} icon={Clock} />
        <StatCard title="Completed" value={instances.filter((i) => i.status === "COMPLETED").length} icon={CheckCircle} />
      </div>

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions"><GitBranch className="mr-2 size-4" />Definitions</TabsTrigger>
          <TabsTrigger value="instances"><Clock className="mr-2 size-4" />Instances</TabsTrigger>
        </TabsList>
        <TabsContent value="definitions" className="space-y-4">
          <Button onClick={() => setShowCreate(true)}>+ New Workflow</Button>
          <DataTable columns={defColumns} data={definitions as unknown as WorkflowDef[]} isLoading={defLoading} />
        </TabsContent>
        <TabsContent value="instances" className="space-y-4">
          <DataTable columns={instColumns} data={instances as unknown as WorkflowInstance[]} isLoading={instLoading} emptyMessage="No pending approvals." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Workflow" onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, steps: [{ name: "Manager Approval", approverRole: "MANAGER", order: 1 }] }, { onSuccess: () => { setShowCreate(false); setForm({ name: "", entityType: "PURCHASE_ORDER" }); } }); }} isLoading={createMutation.isPending}>
        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Purchase Order Approval" /></div>
        <div className="space-y-2"><Label>Entity Type</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.entityType} onChange={(e) => setForm((p) => ({ ...p, entityType: e.target.value }))}><option value="PURCHASE_ORDER">Purchase Order</option><option value="SALES_ORDER">Sales Order</option><option value="EXPENSE_CLAIM">Expense Claim</option><option value="JOURNAL_ENTRY">Journal Entry</option></select></div>
      </FormDialog>
    </div>
  );
}
