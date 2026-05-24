"use client";

import { useState } from "react";
import { Cog, Wrench, AlertTriangle, Plus, Gauge } from "lucide-react";
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
import { todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Machine { id: string; name: string; code: string; type: string; location: string; status: string; }
interface MaintenanceLog { id: string; machineName: string; type: string; date: string; description: string; cost: number; status: string; }

const machineColumns: Column<Machine>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Machine Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "location", header: "Location" },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { OPERATIONAL: "bg-emerald-600", MAINTENANCE: "bg-amber-600", BREAKDOWN: "bg-red-600", IDLE: "" };
      return <Badge variant={item.status === "IDLE" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const maintenanceColumns: Column<MaintenanceLog>[] = [
  { key: "machineName", header: "Machine" },
  { key: "type", header: "Type", render: (item) => {
    const c: Record<string, string> = { PREVENTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", CORRECTIVE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", BREAKDOWN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c[item.type] ?? ""}`}>{item.type}</span>;
  }},
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "description", header: "Description", render: (item) => <span className="max-w-[200px] truncate block">{item.description}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"} className={item.status === "COMPLETED" ? "bg-emerald-600" : ""}>{item.status}</Badge>,
  },
];

export default function MachinesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "SHELLER", location: "" });

  const { data: machines = [], isLoading: mLoading } = useApiList<Machine>(["machines"], "/machines");
  const { data: logs = [], isLoading: lLoading } = useApiList<MaintenanceLog>(["maintenance-logs"], "/machines/maintenance");
  const createMutation = useApiMutation<Machine, typeof form>("/machines", "post", [["machines"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Machine Management" description="Machines, maintenance schedules, spare parts, and OEE tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Machines" value={machines.length} icon={Cog} description={`${machines.filter((m) => m.status === "OPERATIONAL").length} operational`} />
        <StatCard title="Maintenance Logs" value={logs.length} icon={Wrench} />
        <StatCard title="Breakdowns" value={machines.filter((m) => m.status === "BREAKDOWN").length} icon={AlertTriangle} />
        <StatCard title="OEE" value="—" icon={Gauge} description="Overall Equipment Effectiveness" />
      </div>

      <Tabs defaultValue="machines">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="machines" className="gap-1.5"><Cog className="size-3.5" />Machines</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="size-3.5" />Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="machines" className="space-y-4 mt-4">
          <DataTable
            columns={machineColumns}
            data={machines as unknown as Machine[]}
            isLoading={mLoading}
            emptyMessage="No machines registered."
            searchPlaceholder="Search machines..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
                <Plus className="size-3.5" />
                New Machine
              </Button>
            }
          />
        </TabsContent>
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <DataTable columns={maintenanceColumns} data={logs as unknown as MaintenanceLog[]} isLoading={lLoading} emptyMessage="No maintenance logs." searchPlaceholder="Search logs..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Machine" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form, { onSuccess: () => { setShowCreate(false); toast.success("Machine added"); setForm({ name: "", code: "", type: "SHELLER", location: "" }); } }); }} isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. MCH-001" className="font-mono" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Type</Label><select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="SHELLER">Sheller</option><option value="WHITENER">Whitener</option><option value="POLISHER">Polisher</option><option value="GRADER">Grader</option><option value="COLOR_SORTER">Color Sorter</option><option value="PACKING">Packing</option></select></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Location</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Mill Floor 1" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
