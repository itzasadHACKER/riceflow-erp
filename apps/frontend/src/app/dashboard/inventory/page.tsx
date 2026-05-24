"use client";

import { useState } from "react";
import { Warehouse, Package, ArrowUpDown, Plus, Boxes } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface WarehouseItem { id: string; name: string; code: string; address: string; capacity: number; isActive: boolean; }
interface StockMovement { id: string; movementNumber: string; type: string; date: string; itemName: string; quantity: number; warehouseName: string; }

const warehouseColumns: Column<WarehouseItem>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Warehouse Name" },
  { key: "address", header: "Address" },
  { key: "capacity", header: "Capacity", className: "text-right", render: (item) => <span className="font-mono">{item.capacity?.toLocaleString()} MT</span> },
  {
    key: "isActive",
    header: "Status",
    render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge>,
  },
];

const movementColumns: Column<StockMovement>[] = [
  { key: "movementNumber", header: "Movement #", render: (item) => <span className="font-mono font-medium">{item.movementNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  {
    key: "type",
    header: "Type",
    render: (item) => {
      const colors: Record<string, string> = { IN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", OUT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.type] ?? ""}`}>{item.type}</span>;
    },
  },
  { key: "itemName", header: "Item" },
  { key: "quantity", header: "Qty", className: "text-right", render: (item) => <span className="font-mono">{item.quantity?.toLocaleString()}</span> },
  { key: "warehouseName", header: "Warehouse" },
];

export default function InventoryPage() {
  const [showCreateWH, setShowCreateWH] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", code: "", address: "", capacity: "" });

  const { data: warehouses = [], isLoading: whLoading } = useApiList<WarehouseItem>(["warehouses"], "/inventory/warehouses");
  const { data: movements = [], isLoading: movLoading } = useApiList<StockMovement>(["stock-movements"], "/inventory/stock-movements");

  const createWHMutation = useApiMutation<WarehouseItem, unknown>("/inventory/warehouses", "post", [["warehouses"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory & Warehousing" description="Warehouses, stock movements, items, and stock management" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Warehouses" value={warehouses.length} icon={Warehouse} description={`${warehouses.filter((w) => w.isActive).length} active`} />
        <StatCard title="Stock Movements" value={movements.length} icon={ArrowUpDown} />
        <StatCard title="Inward" value={movements.filter((m) => m.type === "IN").length} icon={Package} description="Receipts" />
        <StatCard title="Outward" value={movements.filter((m) => m.type === "OUT").length} icon={Boxes} description="Dispatches" />
      </div>

      <Tabs defaultValue="movements">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="movements" className="gap-1.5"><ArrowUpDown className="size-3.5" />Stock Movements</TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-1.5"><Warehouse className="size-3.5" />Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4 mt-4">
          <DataTable columns={movementColumns} data={movements as unknown as StockMovement[]} isLoading={movLoading} emptyMessage="No stock movements yet." searchPlaceholder="Search movements..." />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4 mt-4">
          <DataTable
            columns={warehouseColumns}
            data={warehouses as unknown as WarehouseItem[]}
            isLoading={whLoading}
            emptyMessage="No warehouses yet."
            searchPlaceholder="Search warehouses..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateWH(true)}>
                <Plus className="size-3.5" />
                New Warehouse
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateWH}
        onOpenChange={setShowCreateWH}
        title="Add Warehouse"
        description={`Warehouse # ${generateNumber("warehouse", warehouses.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createWHMutation.mutate({ ...whForm, capacity: Number(whForm.capacity) }, {
            onSuccess: () => { setShowCreateWH(false); toast.success("Warehouse added"); setWhForm({ name: "", code: "", address: "", capacity: "" }); },
          });
        }}
        isLoading={createWHMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Code</Label>
            <Input value={whForm.code} onChange={(e) => setWhForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. WH-001" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Name</Label>
            <Input value={whForm.name} onChange={(e) => setWhForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Warehouse name" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Address</Label>
          <Textarea value={whForm.address} onChange={(e) => setWhForm((p) => ({ ...p, address: e.target.value }))} rows={2} placeholder="Location address" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Capacity (MT)</Label>
          <Input type="number" min="0" value={whForm.capacity} onChange={(e) => setWhForm((p) => ({ ...p, capacity: e.target.value }))} required placeholder="0" className="font-mono" />
        </div>
      </FormDialog>
    </div>
  );
}
