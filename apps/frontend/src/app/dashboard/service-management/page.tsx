"use client";

import { useState } from "react";
import { Phone, FileText, Cpu, BookOpen, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface ServiceCall { id: string; callNumber: string; subject: string; status: string; priority: string; customer?: { name: string }; createdAt: string; }
interface Contract { id: string; contractNumber: string; contractType: string; customer?: { name: string }; startDate: string; endDate: string; isActive: boolean; }
interface Equipment { id: string; equipmentNumber: string; itemName: string; customer?: { name: string }; serialNumber: string; status: string; }
interface Solution { id: string; title: string; status: string; createdAt: string; }

const priorityColors: Record<string, string> = { LOW: "bg-slate-500", MEDIUM: "bg-blue-500", HIGH: "bg-orange-500", CRITICAL: "bg-red-600" };
const statusColors: Record<string, string> = { OPEN: "bg-blue-500", IN_PROGRESS: "bg-amber-500", ESCALATED: "bg-red-500", RESOLVED: "bg-emerald-500", CLOSED: "bg-slate-500" };

const callColumns: Column<ServiceCall>[] = [
  { key: "callNumber", header: "Call #", render: (r) => <span className="font-mono font-semibold">{r.callNumber}</span> },
  { key: "subject", header: "Subject" },
  { key: "customer", header: "Customer", render: (r) => r.customer?.name || "-" },
  { key: "priority", header: "Priority", render: (r) => <Badge className={priorityColors[r.priority] || ""}>{r.priority}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] || ""}>{r.status}</Badge> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

const contractColumns: Column<Contract>[] = [
  { key: "contractNumber", header: "Contract #", render: (r) => <span className="font-mono font-semibold">{r.contractNumber}</span> },
  { key: "contractType", header: "Type", render: (r) => <Badge variant="outline">{r.contractType}</Badge> },
  { key: "customer", header: "Customer", render: (r) => r.customer?.name || "-" },
  { key: "startDate", header: "Start", render: (r) => formatDate(r.startDate) },
  { key: "endDate", header: "End", render: (r) => formatDate(r.endDate) },
  { key: "isActive", header: "Status", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Active" : "Expired"}</Badge> },
];

const equipmentColumns: Column<Equipment>[] = [
  { key: "equipmentNumber", header: "Equipment #", render: (r) => <span className="font-mono font-semibold">{r.equipmentNumber}</span> },
  { key: "itemName", header: "Item" },
  { key: "customer", header: "Customer", render: (r) => r.customer?.name || "-" },
  { key: "serialNumber", header: "Serial #", render: (r) => <span className="font-mono">{r.serialNumber || "-"}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "ACTIVE" ? "bg-emerald-600" : "bg-slate-500"}>{r.status}</Badge> },
];

const solutionColumns: Column<Solution>[] = [
  { key: "title", header: "Title" },
  { key: "status", header: "Status", render: (r) => <Badge variant="outline">{r.status}</Badge> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

export default function ServiceManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", customerId: "", priority: "MEDIUM", description: "", origin: "PHONE" });

  const { data: calls = [], isLoading } = useApiList<ServiceCall>(["service-calls"], "/service-management/calls");
  const { data: contracts = [] } = useApiList<Contract>(["service-contracts"], "/service-management/contracts");
  const { data: equipment = [] } = useApiList<Equipment>(["equipment"], "/service-management/equipment");
  const { data: solutions = [] } = useApiList<Solution>(["solutions"], "/service-management/solutions");
  const { data: summary } = useApiList<any>(["service-summary"], "/service-management/summary");

  const createMut = useApiMutation("/service-management/calls", "post", { invalidateKeys: [["service-calls"], ["service-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Service call created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Service Management" description="Manage service calls, contracts, equipment, and knowledge base">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Service Call</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Calls" value={stats?.totalCalls ?? 0} icon={Phone} />
        <StatCard title="Open Calls" value={stats?.openCalls ?? 0} icon={AlertTriangle} />
        <StatCard title="Active Contracts" value={stats?.activeContracts ?? 0} icon={FileText} />
        <StatCard title="Equipment Cards" value={stats?.equipmentCards ?? 0} icon={Cpu} />
      </div>

      <Tabs defaultValue="calls" className="space-y-4">
        <TabsList><TabsTrigger value="calls">Service Calls</TabsTrigger><TabsTrigger value="contracts">Contracts</TabsTrigger><TabsTrigger value="equipment">Equipment</TabsTrigger><TabsTrigger value="solutions">Knowledge Base</TabsTrigger></TabsList>
        <TabsContent value="calls"><DataTable columns={callColumns} data={calls} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="contracts"><DataTable columns={contractColumns} data={contracts}  /></TabsContent>
        <TabsContent value="equipment"><DataTable columns={equipmentColumns} data={equipment}  /></TabsContent>
        <TabsContent value="solutions"><DataTable columns={solutionColumns} data={solutions}  /></TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Service Call" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Describe the issue" /></div>
          <div><Label>Customer ID</Label><Input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} placeholder="Customer UUID" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Priority</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem></SelectContent></Select></div>
            <div><Label>Origin</Label><Select value={form.origin} onValueChange={(v) => setForm({ ...form, origin: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PHONE">Phone</SelectItem><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="WALK_IN">Walk-in</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
