"use client";

import { useState } from "react";
import { Building, Calculator, Trash2 } from "lucide-react";
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

interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  purchaseDate: string;
  purchaseCost: string;
  currentValue: string;
  depreciationMethod: string;
  status: string;
}

const assetColumns: Column<Asset>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "category", header: "Category", render: (item) => <Badge variant="outline">{item.category}</Badge> },
  { key: "purchaseDate", header: "Purchase Date", render: (item) => new Date(item.purchaseDate).toLocaleDateString() },
  { key: "purchaseCost", header: "Cost", render: (item) => Number(item.purchaseCost).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "currentValue", header: "Current Value", render: (item) => Number(item.currentValue).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function AssetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", category: "MACHINERY", purchaseDate: new Date().toISOString().split("T")[0], purchaseCost: "", usefulLife: "10", depreciationMethod: "STRAIGHT_LINE" });

  const { data: assets = [], isLoading } = useApiList<Asset>(["assets"], "/assets");
  const createMutation = useApiMutation<Asset, unknown>("/assets", "post", [["assets"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed Assets" description="Asset register, depreciation tracking, and disposal" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Assets" value={assets.length} icon={Building} />
        <StatCard title="Depreciation" value="—" icon={Calculator} description="Run depreciation" />
        <StatCard title="Disposed" value={assets.filter((a) => a.status === "DISPOSED").length} icon={Trash2} />
      </div>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register"><Building className="mr-2 size-4" />Asset Register</TabsTrigger>
          <TabsTrigger value="depreciation"><Calculator className="mr-2 size-4" />Depreciation</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="space-y-4">
          <Button onClick={() => setShowCreate(true)}>+ New Asset</Button>
          <DataTable columns={assetColumns} data={assets as unknown as Asset[]} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="depreciation" className="space-y-4">
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            <Calculator className="mx-auto mb-3 size-10" />
            <p className="font-medium">Depreciation Schedule</p>
            <p className="text-sm">Run depreciation to see the schedule for all assets.</p>
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Asset" onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, purchaseCost: Number(form.purchaseCost), usefulLife: Number(form.usefulLife) }, { onSuccess: () => { setShowCreate(false); } }); }} isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="AST-001" /></div>
          <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Category</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}><option value="MACHINERY">Machinery</option><option value="VEHICLE">Vehicle</option><option value="BUILDING">Building</option><option value="FURNITURE">Furniture</option><option value="EQUIPMENT">Equipment</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Purchase Cost (PKR)</Label><Input type="number" value={form.purchaseCost} onChange={(e) => setForm((p) => ({ ...p, purchaseCost: e.target.value }))} required placeholder="0" /></div>
          <div className="space-y-2"><Label>Useful Life (Years)</Label><Input type="number" value={form.usefulLife} onChange={(e) => setForm((p) => ({ ...p, usefulLife: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Depreciation Method</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.depreciationMethod} onChange={(e) => setForm((p) => ({ ...p, depreciationMethod: e.target.value }))}><option value="STRAIGHT_LINE">Straight Line</option><option value="WRITTEN_DOWN">Written Down Value</option></select></div>
      </FormDialog>
    </div>
  );
}
