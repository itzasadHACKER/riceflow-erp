"use client";

import { useState } from "react";
import { Warehouse, Package, ArrowUpDown, ClipboardCheck } from "lucide-react";
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

interface WarehouseItem { id: string; name: string; code: string; address: string; capacity: number; isActive: boolean; }
interface StockMovement { id: string; movementNumber: string; type: string; date: string; itemName: string; quantity: number; warehouseName: string; }

const warehouseColumns: Column<WarehouseItem>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "address", header: "Address" },
  { key: "capacity", header: "Capacity" },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const movementColumns: Column<StockMovement>[] = [
  { key: "movementNumber", header: "Movement #" },
  { key: "type", header: "Type", render: (item) => <Badge variant={item.type === "IN" ? "default" : item.type === "OUT" ? "destructive" : "secondary"}>{item.type}</Badge> },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "quantity", header: "Quantity" },
];

export default function InventoryPage() {
  const [showCreateWarehouse, setShowCreateWarehouse] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", code: "", address: "", capacity: "" });

  const { data: warehouses = [], isLoading: whLoading } = useApiList<WarehouseItem>(["warehouses"], "/inventory/warehouses");
  const { data: movements = [], isLoading: movLoading } = useApiList<StockMovement>(["stock-movements"], "/inventory/stock-movements");

  const createWhMutation = useApiMutation<WarehouseItem, unknown>("/inventory/warehouses", "post", [["warehouses"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory & Warehousing" description="Warehouses, stock movements, adjustments, and tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Warehouses" value={warehouses.length} icon={Warehouse} />
        <StatCard title="Stock Movements" value={movements.length} icon={ArrowUpDown} />
        <StatCard title="Items" value="—" icon={Package} />
        <StatCard title="Cycle Counts" value="—" icon={ClipboardCheck} />
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses"><Warehouse className="mr-2 size-4" />Warehouses</TabsTrigger>
          <TabsTrigger value="movements"><ArrowUpDown className="mr-2 size-4" />Stock Movements</TabsTrigger>
        </TabsList>
        <TabsContent value="warehouses" className="space-y-4">
          <Button onClick={() => setShowCreateWarehouse(true)}>+ New Warehouse</Button>
          <DataTable columns={warehouseColumns} data={warehouses as unknown as WarehouseItem[]} isLoading={whLoading} />
        </TabsContent>
        <TabsContent value="movements" className="space-y-4">
          <DataTable columns={movementColumns} data={movements as unknown as StockMovement[]} isLoading={movLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateWarehouse} onOpenChange={setShowCreateWarehouse} title="Add Warehouse" onSubmit={(e) => { e.preventDefault(); createWhMutation.mutate({ ...whForm, capacity: Number(whForm.capacity) }, { onSuccess: () => { setShowCreateWarehouse(false); setWhForm({ name: "", code: "", address: "", capacity: "" }); } }); }} isLoading={createWhMutation.isPending}>
        <div className="space-y-2"><Label>Code</Label><Input value={whForm.code} onChange={(e) => setWhForm((p) => ({ ...p, code: e.target.value }))} required placeholder="WH-001" /></div>
        <div className="space-y-2"><Label>Name</Label><Input value={whForm.name} onChange={(e) => setWhForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Address</Label><Input value={whForm.address} onChange={(e) => setWhForm((p) => ({ ...p, address: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={whForm.capacity} onChange={(e) => setWhForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="Tons" /></div>
      </FormDialog>
    </div>
  );
}
