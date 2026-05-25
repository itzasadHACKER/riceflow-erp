"use client";

import { useState } from "react";
import { Package, ArrowLeftRight, ClipboardList, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface TransferRequest { id: string; reference: string; movementType: string; quantity: number; status: string; date: string; }
interface InventoryCount { id: string; countNumber: string; countDate: string; status: string; items: { inventoryItemId: string; systemQuantity: number; countedQuantity: number; variance: number }[]; }
interface Warehouse { id: string; name: string; code: string; }

const transferColumns: Column<TransferRequest>[] = [
  { key: "reference", header: "Reference", render: (i) => <span className="font-mono font-medium text-primary">{i.reference || i.id.slice(0, 8)}</span> },
  { key: "date", header: "Date", render: (i) => formatDate(i.date) },
  { key: "quantity", header: "Quantity", render: (i) => <span className="font-mono">{i.quantity}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "COMPLETED" ? "default" : "secondary"}>{i.status}</Badge> },
];

const countColumns: Column<InventoryCount>[] = [
  { key: "countNumber", header: "Count #", render: (i) => <span className="font-mono font-medium text-primary">{i.countNumber}</span> },
  { key: "countDate", header: "Date", render: (i) => formatDate(i.countDate) },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "COMPLETED_COUNT" ? "default" : "secondary"}>{i.status}</Badge> },
  { key: "items", header: "Items", render: (i) => <Badge variant="outline">{i.items?.length || 0} items</Badge> },
];

export default function InventoryEnhancedPage() {
  const [transferOpen, setTransferOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);

  const { data: transfers = [], refetch: refetchTransfers } = useApiList<TransferRequest>(["transfer-requests"], "/inventory-enhanced/transfer-requests");
  const { data: warehouses = [] } = useApiList<Warehouse>(["ie-warehouses"], "/inventory/warehouses");

  const createTransfer = useApiMutation("/inventory-enhanced/transfer-requests", "post");
  const createCount = useApiMutation("/inventory-enhanced/inventory-counts", "post");

  const transferList = Array.isArray(transfers) ? transfers : [];
  const warehouseList = Array.isArray(warehouses) ? warehouses : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Enhancements" description="Transfer requests, inventory counting documents, and item master enhancements" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Transfer Requests" value={transferList.length} icon={ArrowLeftRight} description="Inter-warehouse transfers" />
        <StatCard title="Warehouses" value={warehouseList.length} icon={Package} description="Active locations" />
        <StatCard title="Counting Docs" value={0} icon={ClipboardList} description="Inventory counts" />
      </div>

      <Tabs defaultValue="transfers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transfers">Transfer Requests</TabsTrigger>
          <TabsTrigger value="counting">Inventory Counting</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTransferOpen(true)}><Plus className="mr-2 h-4 w-4" />New Transfer Request</Button>
          </div>
          <DataTable columns={transferColumns} data={transferList} />
          <FormDialog open={transferOpen} onOpenChange={setTransferOpen} title="Create Transfer Request" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createTransfer.mutateAsync({
              sourceWarehouseId: fd.get("sourceWarehouseId"),
              destinationWarehouseId: fd.get("destinationWarehouseId"),
              quantity: Number(fd.get("quantity")),
              notes: fd.get("notes"),
            });
            toast.success("Transfer request created"); setTransferOpen(false); refetchTransfers();
          }}>
            <div className="grid gap-4">
              <div><Label>Source Warehouse</Label>
                <Select name="sourceWarehouseId"><SelectTrigger><SelectValue placeholder="From warehouse" /></SelectTrigger>
                  <SelectContent>{warehouseList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Destination Warehouse</Label>
                <Select name="destinationWarehouseId"><SelectTrigger><SelectValue placeholder="To warehouse" /></SelectTrigger>
                  <SelectContent>{warehouseList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" step="0.01" required /></div>
              <div><Label>Notes</Label><Textarea name="notes" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="counting" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCountOpen(true)}><Plus className="mr-2 h-4 w-4" />New Inventory Count</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Inventory Counting Documents</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Create formal count sheets, record actual quantities, and post variances to adjust stock levels.</p>
              <div className="rounded-lg border p-4 bg-amber-50">
                <p className="text-sm font-medium">Process:</p>
                <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                  <li>Create count document for a warehouse</li>
                  <li>Count items and record actual quantities</li>
                  <li>System calculates variance (actual - system qty)</li>
                  <li>Post count to adjust inventory levels</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          <FormDialog open={countOpen} onOpenChange={setCountOpen} title="Create Inventory Count" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createCount.mutateAsync({
              warehouseId: fd.get("warehouseId"),
              countDate: fd.get("countDate"),
              items: [{ itemId: fd.get("itemId"), systemQty: Number(fd.get("systemQty")), actualQty: Number(fd.get("actualQty")) }],
            });
            toast.success("Inventory count created"); setCountOpen(false);
          }}>
            <div className="grid gap-4">
              <div><Label>Warehouse</Label>
                <Select name="warehouseId"><SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>{warehouseList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Count Date</Label><Input name="countDate" type="date" defaultValue={todayISO()} /></div>
              <p className="text-sm font-medium">Item to Count</p>
              <div><Label>Item ID</Label><Input name="itemId" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>System Qty</Label><Input name="systemQty" type="number" step="0.01" /></div>
                <div><Label>Actual Qty</Label><Input name="actualQty" type="number" step="0.01" required /></div>
              </div>
            </div>
          </FormDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
