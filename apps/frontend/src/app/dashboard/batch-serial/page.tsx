"use client";

import { useState } from "react";
import { Layers, Hash, AlertTriangle, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Batch { id: string; batchNumber: string; itemCode: string; quantity: string; status: string; expiryDate: string; manufacturingDate: string; supplierBatch: string; }
interface SerialNum { id: string; serialNumber: string; itemCode: string; status: string; warrantyStart: string; warrantyEnd: string; customerId: string; }

const batchColumns: Column<Batch>[] = [
  { key: "batchNumber", header: "Batch #", render: (r) => <span className="font-mono font-semibold">{r.batchNumber}</span> },
  { key: "itemCode", header: "Item" },
  { key: "quantity", header: "Qty", className: "text-right", render: (r) => <span className="font-mono">{Number(r.quantity).toLocaleString()}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "AVAILABLE" ? "bg-emerald-600" : r.status === "QUARANTINE" ? "bg-amber-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "expiryDate", header: "Expiry", render: (r) => r.expiryDate ? formatDate(r.expiryDate) : "-" },
  { key: "manufacturingDate", header: "Mfg Date", render: (r) => r.manufacturingDate ? formatDate(r.manufacturingDate) : "-" },
];

const serialColumns: Column<SerialNum>[] = [
  { key: "serialNumber", header: "Serial #", render: (r) => <span className="font-mono font-semibold">{r.serialNumber}</span> },
  { key: "itemCode", header: "Item" },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "AVAILABLE" ? "bg-emerald-600" : r.status === "SOLD" ? "bg-blue-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "warrantyStart", header: "Warranty Start", render: (r) => r.warrantyStart ? formatDate(r.warrantyStart) : "-" },
  { key: "warrantyEnd", header: "Warranty End", render: (r) => r.warrantyEnd ? formatDate(r.warrantyEnd) : "-" },
];

export default function BatchSerialPage() {
  const [showBatch, setShowBatch] = useState(false);
  const [showSerial, setShowSerial] = useState(false);
  const [bForm, setBForm] = useState({ batchNumber: "", itemCode: "", quantity: 0, expiryDate: "", manufacturingDate: "" });
  const [sForm, setSForm] = useState({ serialNumber: "", itemCode: "", warrantyStart: "", warrantyEnd: "" });

  const { data: batches = [], isLoading } = useApiList<Batch>(["batches"], "/batch-serial/batches");
  const { data: serials = [] } = useApiList<SerialNum>(["serials"], "/batch-serial/serials");
  const { data: summary } = useApiList<any>(["bs-summary"], "/batch-serial/summary");

  const batchMut = useApiMutation("/batch-serial/batches", "post", { invalidateKeys: [["batches"], ["bs-summary"]], onSuccess: () => { setShowBatch(false); toast.success("Batch created"); } });
  const serialMut = useApiMutation("/batch-serial/serials", "post", { invalidateKeys: [["serials"], ["bs-summary"]], onSuccess: () => { setShowSerial(false); toast.success("Serial number registered"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Batch & Serial Tracking" description="Full traceability with batch numbers, serial numbers, expiry dates, and warranty tracking">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSerial(true)}><Hash className="mr-2 h-4 w-4" />New Serial</Button>
          <Button onClick={() => setShowBatch(true)}><Plus className="mr-2 h-4 w-4" />New Batch</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Batches" value={stats?.totalBatches ?? 0} icon={Layers} />
        <StatCard title="Available Batches" value={stats?.availableBatches ?? 0} icon={Layers} trend="up" />
        <StatCard title="Total Serials" value={stats?.totalSerialNumbers ?? 0} icon={Hash} />
        <StatCard title="Available Serials" value={stats?.availableSerials ?? 0} icon={Hash} trend="up" />
      </div>

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList><TabsTrigger value="batches">Batches</TabsTrigger><TabsTrigger value="serials">Serial Numbers</TabsTrigger></TabsList>
        <TabsContent value="batches"><DataTable columns={batchColumns} data={batches} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="serials"><DataTable columns={serialColumns} data={serials}  /></TabsContent>
      </Tabs>

      <FormDialog open={showBatch} onOpenChange={setShowBatch} title="New Batch Record" onSubmit={() => batchMut.mutate(bForm)} isLoading={batchMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Batch Number</Label><Input value={bForm.batchNumber} onChange={(e) => setBForm({ ...bForm, batchNumber: e.target.value })} /></div><div><Label>Item Code</Label><Input value={bForm.itemCode} onChange={(e) => setBForm({ ...bForm, itemCode: e.target.value })} /></div></div>
          <div><Label>Quantity</Label><Input type="number" value={bForm.quantity} onChange={(e) => setBForm({ ...bForm, quantity: Number(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Manufacturing Date</Label><Input type="date" value={bForm.manufacturingDate} onChange={(e) => setBForm({ ...bForm, manufacturingDate: e.target.value })} /></div><div><Label>Expiry Date</Label><Input type="date" value={bForm.expiryDate} onChange={(e) => setBForm({ ...bForm, expiryDate: e.target.value })} /></div></div>
        </div>
      </FormDialog>

      <FormDialog open={showSerial} onOpenChange={setShowSerial} title="Register Serial Number" onSubmit={() => serialMut.mutate(sForm)} isLoading={serialMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Serial Number</Label><Input value={sForm.serialNumber} onChange={(e) => setSForm({ ...sForm, serialNumber: e.target.value })} /></div><div><Label>Item Code</Label><Input value={sForm.itemCode} onChange={(e) => setSForm({ ...sForm, itemCode: e.target.value })} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Warranty Start</Label><Input type="date" value={sForm.warrantyStart} onChange={(e) => setSForm({ ...sForm, warrantyStart: e.target.value })} /></div><div><Label>Warranty End</Label><Input type="date" value={sForm.warrantyEnd} onChange={(e) => setSForm({ ...sForm, warrantyEnd: e.target.value })} /></div></div>
        </div>
      </FormDialog>
    </div>
  );
}
