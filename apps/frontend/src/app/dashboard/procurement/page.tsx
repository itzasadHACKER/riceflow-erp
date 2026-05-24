"use client";

import { useState } from "react";
import { Wheat, Users, BarChart3, FlaskConical } from "lucide-react";
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

interface Supplier { id: string; name: string; type: string; phone: string; email: string; address: string; isActive: boolean; }
interface RiceVariety { id: string; name: string; code: string; category: string; description: string; }
interface PaddyPurchase { id: string; purchaseNumber: string; date: string; supplierName: string; varietyName: string; grossWeight: number; netWeight: number; rate: number; totalAmount: string; isPosted: boolean; }

const supplierColumns: Column<Supplier>[] = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const varietyColumns: Column<RiceVariety>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "category", header: "Category" },
  { key: "description", header: "Description" },
];

const purchaseColumns: Column<PaddyPurchase>[] = [
  { key: "purchaseNumber", header: "Purchase #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "grossWeight", header: "Gross Wt (kg)" },
  { key: "netWeight", header: "Net Wt (kg)" },
  { key: "rate", header: "Rate/kg" },
  { key: "totalAmount", header: "Total", render: (item) => Number(item.totalAmount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "isPosted", header: "Status", render: (item) => <Badge variant={item.isPosted ? "default" : "secondary"}>{item.isPosted ? "Posted" : "Draft"}</Badge> },
];

export default function ProcurementPage() {
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showCreateVariety, setShowCreateVariety] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", type: "FARMER", phone: "", email: "", address: "" });
  const [varietyForm, setVarietyForm] = useState({ name: "", code: "", category: "BASMATI", description: "" });

  const { data: suppliers = [], isLoading: suppLoading } = useApiList<Supplier>(["suppliers"], "/procurement/suppliers");
  const { data: varieties = [], isLoading: varLoading } = useApiList<RiceVariety>(["varieties"], "/procurement/rice-varieties");
  const { data: purchases = [], isLoading: purchLoading } = useApiList<PaddyPurchase>(["purchases"], "/procurement/paddy-purchases");

  const createSuppMutation = useApiMutation<Supplier, typeof supplierForm>("/procurement/suppliers", "post", [["suppliers"]]);
  const createVarMutation = useApiMutation<RiceVariety, typeof varietyForm>("/procurement/rice-varieties", "post", [["varieties"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement" description="Suppliers, rice varieties, paddy purchases, and quality testing" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Suppliers" value={suppliers.length} icon={Users} />
        <StatCard title="Rice Varieties" value={varieties.length} icon={Wheat} />
        <StatCard title="Purchases" value={purchases.length} icon={BarChart3} description={`${purchases.filter((p) => p.isPosted).length} posted`} />
        <StatCard title="Quality Tests" value="—" icon={FlaskConical} />
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers"><Users className="mr-2 size-4" />Suppliers</TabsTrigger>
          <TabsTrigger value="varieties"><Wheat className="mr-2 size-4" />Rice Varieties</TabsTrigger>
          <TabsTrigger value="purchases"><BarChart3 className="mr-2 size-4" />Paddy Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="space-y-4">
          <Button onClick={() => setShowCreateSupplier(true)}>+ New Supplier</Button>
          <DataTable columns={supplierColumns} data={suppliers as unknown as Supplier[]} isLoading={suppLoading} />
        </TabsContent>
        <TabsContent value="varieties" className="space-y-4">
          <Button onClick={() => setShowCreateVariety(true)}>+ New Variety</Button>
          <DataTable columns={varietyColumns} data={varieties as unknown as RiceVariety[]} isLoading={varLoading} />
        </TabsContent>
        <TabsContent value="purchases" className="space-y-4">
          <DataTable columns={purchaseColumns} data={purchases as unknown as PaddyPurchase[]} isLoading={purchLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateSupplier} onOpenChange={setShowCreateSupplier} title="Add Supplier" onSubmit={(e) => { e.preventDefault(); createSuppMutation.mutate(supplierForm, { onSuccess: () => { setShowCreateSupplier(false); setSupplierForm({ name: "", type: "FARMER", phone: "", email: "", address: "" }); } }); }} isLoading={createSuppMutation.isPending}>
        <div className="space-y-2"><Label>Name</Label><Input value={supplierForm.name} onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Type</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={supplierForm.type} onChange={(e) => setSupplierForm((p) => ({ ...p, type: e.target.value }))}><option value="FARMER">Farmer</option><option value="DEALER">Dealer</option><option value="COMMISSION_AGENT">Commission Agent</option><option value="ARTHI">Arthi</option></select></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={supplierForm.phone} onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm((p) => ({ ...p, email: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Address</Label><Input value={supplierForm.address} onChange={(e) => setSupplierForm((p) => ({ ...p, address: e.target.value }))} /></div>
      </FormDialog>

      <FormDialog open={showCreateVariety} onOpenChange={setShowCreateVariety} title="Add Rice Variety" onSubmit={(e) => { e.preventDefault(); createVarMutation.mutate(varietyForm, { onSuccess: () => { setShowCreateVariety(false); setVarietyForm({ name: "", code: "", category: "BASMATI", description: "" }); } }); }} isLoading={createVarMutation.isPending}>
        <div className="space-y-2"><Label>Code</Label><Input value={varietyForm.code} onChange={(e) => setVarietyForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. BAS-SUP" /></div>
        <div className="space-y-2"><Label>Name</Label><Input value={varietyForm.name} onChange={(e) => setVarietyForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Category</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={varietyForm.category} onChange={(e) => setVarietyForm((p) => ({ ...p, category: e.target.value }))}><option value="BASMATI">Basmati</option><option value="NON_BASMATI">Non-Basmati</option><option value="IRRI">IRRI</option><option value="SELLA">Sella</option></select></div>
        <div className="space-y-2"><Label>Description</Label><Input value={varietyForm.description} onChange={(e) => setVarietyForm((p) => ({ ...p, description: e.target.value }))} /></div>
      </FormDialog>
    </div>
  );
}
