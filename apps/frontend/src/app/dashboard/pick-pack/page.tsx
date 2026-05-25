"use client";

import { useState } from "react";
import { PackageSearch, Package, Truck, Plus } from "lucide-react";
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

interface PickList { id: string; pickListNumber: string; status: string; createdAt: string; completedAt: string; }
interface PackingList { id: string; packingNumber: string; status: string; shippingMethod: string; trackingNumber: string; totalWeight: number; totalPackages: number; createdAt: string; }

const pickColumns: Column<PickList>[] = [
  { key: "pickListNumber", header: "Pick List #", render: (r) => <span className="font-mono font-semibold">{r.pickListNumber}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "COMPLETED" ? "bg-emerald-600" : r.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
  { key: "completedAt", header: "Completed", render: (r) => r.completedAt ? formatDate(r.completedAt) : "-" },
];

const packColumns: Column<PackingList>[] = [
  { key: "packingNumber", header: "Packing #", render: (r) => <span className="font-mono font-semibold">{r.packingNumber}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "SHIPPED" ? "bg-emerald-600" : r.status === "PACKING" ? "bg-blue-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "shippingMethod", header: "Shipping", render: (r) => r.shippingMethod || "-" },
  { key: "trackingNumber", header: "Tracking #", render: (r) => r.trackingNumber ? <span className="font-mono">{r.trackingNumber}</span> : "-" },
  { key: "totalWeight", header: "Weight", className: "text-right", render: (r) => r.totalWeight ? `${r.totalWeight} kg` : "-" },
  { key: "totalPackages", header: "Packages", className: "text-right", render: (r) => <span className="font-mono">{r.totalPackages}</span> },
];

export default function PickPackPage() {
  const [showPick, setShowPick] = useState(false);
  const [showPack, setShowPack] = useState(false);

  const { data: picks = [], isLoading } = useApiList<PickList>(["pick-lists"], "/pick-pack/pick-lists");
  const { data: packs = [] } = useApiList<PackingList>(["packing-lists"], "/pick-pack/packing-lists");
  const { data: summary } = useApiList<any>(["pp-summary"], "/pick-pack/summary");

  const pickMut = useApiMutation("/pick-pack/pick-lists", "post", { invalidateKeys: [["pick-lists"], ["pp-summary"]], onSuccess: () => { setShowPick(false); toast.success("Pick list created"); } });
  const packMut = useApiMutation("/pick-pack/packing-lists", "post", { invalidateKeys: [["packing-lists"], ["pp-summary"]], onSuccess: () => { setShowPack(false); toast.success("Packing list created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Pick & Pack" description="Manage picking lists, packing lists, and shipping operations">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPack(true)}><Package className="mr-2 h-4 w-4" />New Packing List</Button>
          <Button onClick={() => setShowPick(true)}><Plus className="mr-2 h-4 w-4" />New Pick List</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Pick Lists" value={stats?.totalPickLists ?? 0} icon={PackageSearch} />
        <StatCard title="Open Picks" value={stats?.openPicks ?? 0} icon={PackageSearch} />
        <StatCard title="Total Packing" value={stats?.totalPackingLists ?? 0} icon={Package} />
        <StatCard title="In Progress" value={stats?.inProgress ?? 0} icon={Truck} />
      </div>

      <Tabs defaultValue="pick" className="space-y-4">
        <TabsList><TabsTrigger value="pick">Pick Lists</TabsTrigger><TabsTrigger value="pack">Packing Lists</TabsTrigger></TabsList>
        <TabsContent value="pick"><DataTable columns={pickColumns} data={picks} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="pack"><DataTable columns={packColumns} data={packs}  /></TabsContent>
      </Tabs>

      <FormDialog open={showPick} onOpenChange={setShowPick} title="New Pick List" onSubmit={() => pickMut.mutate({})} isLoading={pickMut.isPending}>
        <p className="text-sm text-muted-foreground">A new pick list will be created. You can assign items and warehouse after creation.</p>
      </FormDialog>

      <FormDialog open={showPack} onOpenChange={setShowPack} title="New Packing List" onSubmit={() => packMut.mutate({})} isLoading={packMut.isPending}>
        <p className="text-sm text-muted-foreground">A new packing list will be created. You can add shipping details after creation.</p>
      </FormDialog>
    </div>
  );
}
