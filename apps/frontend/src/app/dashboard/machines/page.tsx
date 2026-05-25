"use client";

import { useState } from "react";
import { Cog, Plus, Wrench, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Machine { id: string; name: string; code: string; type: string; status: string; location: string; manufacturer: string; purchaseDate: string; purchaseCost: string; }
interface Maintenance { id: string; machineName: string; type: string; date: string; cost: string; description: string; status: string; performedBy: string; }
interface SparePart { id: string; name: string; partNumber: string; quantity: number; minStock: number; unitCost: string; machineName: string; }

const machineColumns: Column<Machine>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Machine Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "manufacturer", header: "Manufacturer" },
  { key: "location", header: "Location" },
  {
    key: "status", header: "Status", render: (item) => {
      const c: Record<string, string> = { RUNNING: "bg-emerald-600", IDLE: "", MAINTENANCE: "bg-amber-600", BREAKDOWN: "bg-red-600" };
      return <Badge variant={item.status === "IDLE" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const maintenanceColumns: Column<Maintenance>[] = [
  { key: "machineName", header: "Machine" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "performedBy", header: "Performed By", render: (item) => item.performedBy ?? "—" },
  { key: "cost", header: "Cost", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.cost)}</span> },
  {
    key: "status", header: "Status", render: (item) => {
      const c: Record<string, string> = { COMPLETED: "bg-emerald-600", SCHEDULED: "bg-blue-600", IN_PROGRESS: "bg-amber-600" };
      return <Badge variant={item.status === "SCHEDULED" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const spareColumns: Column<SparePart>[] = [
  { key: "partNumber", header: "Part #", render: (item) => <span className="font-mono text-primary">{item.partNumber}</span> },
  { key: "name", header: "Part Name" },
  { key: "machineName", header: "For Machine" },
  { key: "quantity", header: "Stock", className: "text-right", render: (item) => <span className={`font-mono ${item.quantity <= item.minStock ? "text-red-600 font-semibold" : ""}`}>{item.quantity}</span> },
  { key: "minStock", header: "Min Stock", className: "text-right", render: (item) => <span className="font-mono text-muted-foreground">{item.minStock}</span> },
  { key: "unitCost", header: "Unit Cost", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.unitCost)}</span> },
];

const MACHINE_TYPES = ["HULLER", "POLISHER", "SEPARATOR", "DRYER", "SIEVE", "CONVEYOR", "PACKAGING", "BOILER", "GENERATOR", "OTHER"];

export default function MachinesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showMaint, setShowMaint] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "HULLER", location: "", manufacturer: "", purchaseDate: todayISO(), purchaseCost: 0 });
  const [maintForm, setMaintForm] = useState({ machineId: "", type: "PREVENTIVE", date: todayISO(), cost: 0, description: "", performedBy: "" });

  const { data: machines = [], isLoading: mLoading } = useApiList<Machine>(["machines"], "/machines");
  const { data: maintenance = [], isLoading: mtLoading } = useApiList<Maintenance>(["maintenance"], "/machines/maintenance");
  const { data: spares = [], isLoading: spLoading } = useApiList<SparePart>(["spare-parts"], "/machines/spare-parts");
  const createMutation = useApiMutation("/machines", "post", [["machines"]]);
  const maintMutation = useApiMutation("/machines/maintenance", "post", [["maintenance"]]);

  const running = machines.filter((m) => m.status === "RUNNING").length;
  const breakdown = machines.filter((m) => m.status === "BREAKDOWN").length;
  const lowStock = spares.filter((s) => s.quantity <= s.minStock).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Machine Management" description="Machines, maintenance schedules, spare parts, and OEE tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Machines" value={machines.length} icon={Cog} description={`${running} running`} />
        <StatCard title="Maintenance" value={maintenance.length} icon={Wrench} />
        <StatCard title="Breakdowns" value={breakdown} icon={AlertTriangle} description={breakdown > 0 ? "Attention required" : "All clear"} />
        <StatCard title="Spare Parts" value={spares.length} icon={Activity} description={lowStock > 0 ? `${lowStock} low stock` : "Stock OK"} />
      </div>

      <Tabs defaultValue="machines">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="machines" className="gap-1.5"><Cog className="size-3.5" />Machines ({machines.length})</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5"><Wrench className="size-3.5" />Maintenance ({maintenance.length})</TabsTrigger>
          <TabsTrigger value="spares" className="gap-1.5"><Activity className="size-3.5" />Spare Parts ({spares.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="machines" className="space-y-4 mt-4">
          <DataTable columns={machineColumns} data={machines as unknown as Machine[]} isLoading={mLoading} emptyMessage="No machines registered." searchPlaceholder="Search machines..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />Add Machine</Button>} />
        </TabsContent>
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <DataTable columns={maintenanceColumns} data={maintenance as unknown as Maintenance[]} isLoading={mtLoading} emptyMessage="No maintenance records." searchPlaceholder="Search..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowMaint(true)}><Plus className="size-3.5" />Log Maintenance</Button>} />
        </TabsContent>
        <TabsContent value="spares" className="space-y-4 mt-4">
          <DataTable columns={spareColumns} data={spares as unknown as SparePart[]} isLoading={spLoading} emptyMessage="No spare parts." searchPlaceholder="Search parts..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Machine"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Machine added"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Satake Polisher #3" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. MCH-003" className="font-mono" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {MACHINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Location</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Mill Floor A" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Purchase Cost</Label><Input type="number" value={form.purchaseCost || ""} onChange={(e) => setForm((p) => ({ ...p, purchaseCost: Number(e.target.value) }))} /></div>
        </div>
      </FormDialog>

      <FormDialog open={showMaint} onOpenChange={setShowMaint} title="Log Maintenance"
        onSubmit={(e) => { e.preventDefault(); maintMutation.mutate(maintForm as never, { onSuccess: () => { setShowMaint(false); toast.success("Maintenance logged"); } }); }}
        isLoading={maintMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Machine</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={maintForm.machineId} onChange={(e) => setMaintForm((p) => ({ ...p, machineId: e.target.value }))}>
              <option value="">Select machine</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={maintForm.type} onChange={(e) => setMaintForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="PREVENTIVE">Preventive</option><option value="CORRECTIVE">Corrective</option><option value="PREDICTIVE">Predictive</option><option value="EMERGENCY">Emergency</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Date</Label><Input type="date" value={maintForm.date} onChange={(e) => setMaintForm((p) => ({ ...p, date: e.target.value }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Cost</Label><Input type="number" value={maintForm.cost || ""} onChange={(e) => setMaintForm((p) => ({ ...p, cost: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Performed By</Label><Input value={maintForm.performedBy} onChange={(e) => setMaintForm((p) => ({ ...p, performedBy: e.target.value }))} /></div>
        </div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Description</Label><Input value={maintForm.description} onChange={(e) => setMaintForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the maintenance work..." /></div>
      </FormDialog>
    </div>
  );
}
