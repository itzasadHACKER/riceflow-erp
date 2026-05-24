"use client";

import { useState } from "react";
import { Cog, Wrench, AlertTriangle, Activity } from "lucide-react";
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

interface Machine { id: string; name: string; code: string; type: string; manufacturer: string; status: string; location: string; }
interface MaintenanceLog { id: string; machineId: string; type: string; description: string; date: string; cost: string; status: string; }
interface SparePart { id: string; name: string; partNumber: string; quantity: number; reorderLevel: number; unitCost: string; }

const machineColumns: Column<Machine>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "manufacturer", header: "Manufacturer" },
  { key: "location", header: "Location" },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "OPERATIONAL" ? "default" : item.status === "BREAKDOWN" ? "destructive" : "secondary"}>{item.status}</Badge> },
];

const maintenanceColumns: Column<MaintenanceLog>[] = [
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "description", header: "Description" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "cost", header: "Cost", render: (item) => Number(item.cost).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge> },
];

const spareColumns: Column<SparePart>[] = [
  { key: "partNumber", header: "Part #" },
  { key: "name", header: "Name" },
  { key: "quantity", header: "Qty" },
  { key: "reorderLevel", header: "Reorder Level" },
  { key: "unitCost", header: "Unit Cost", render: (item) => Number(item.unitCost).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
];

export default function MachinesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "MILLING", manufacturer: "", location: "" });

  const { data: machines = [], isLoading: machLoading } = useApiList<Machine>(["machines"], "/machines");
  const { data: maintenance = [], isLoading: maintLoading } = useApiList<MaintenanceLog>(["maintenance"], "/machines/maintenance");
  const { data: spares = [], isLoading: spareLoading } = useApiList<SparePart>(["spares"], "/machines/spare-parts");

  const createMutation = useApiMutation<Machine, typeof form>("/machines", "post", [["machines"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Machine Management" description="Machines, maintenance, spare parts, and OEE tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Machines" value={machines.length} icon={Cog} />
        <StatCard title="Maintenance" value={maintenance.length} icon={Wrench} />
        <StatCard title="Spare Parts" value={spares.length} icon={AlertTriangle} />
        <StatCard title="OEE" value="—" icon={Activity} description="Overall Equipment Effectiveness" />
      </div>

      <Tabs defaultValue="machines">
        <TabsList>
          <TabsTrigger value="machines"><Cog className="mr-2 size-4" />Machines</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="mr-2 size-4" />Maintenance</TabsTrigger>
          <TabsTrigger value="spares"><AlertTriangle className="mr-2 size-4" />Spare Parts</TabsTrigger>
        </TabsList>
        <TabsContent value="machines" className="space-y-4">
          <Button onClick={() => setShowCreate(true)}>+ New Machine</Button>
          <DataTable columns={machineColumns} data={machines as unknown as Machine[]} isLoading={machLoading} />
        </TabsContent>
        <TabsContent value="maintenance" className="space-y-4">
          <DataTable columns={maintenanceColumns} data={maintenance as unknown as MaintenanceLog[]} isLoading={maintLoading} />
        </TabsContent>
        <TabsContent value="spares" className="space-y-4">
          <DataTable columns={spareColumns} data={spares as unknown as SparePart[]} isLoading={spareLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Machine" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ name: "", code: "", type: "MILLING", manufacturer: "", location: "" }); } }); }} isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="MCH-001" /></div>
          <div className="space-y-2"><Label>Type</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="MILLING">Milling</option><option value="SORTING">Sorting</option><option value="PACKAGING">Packaging</option><option value="DRYING">Drying</option></select></div>
        </div>
        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
      </FormDialog>
    </div>
  );
}
