"use client";

import { useState } from "react";
import { Globe, FileText, Ship, CreditCard } from "lucide-react";
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

interface ExportContract { id: string; contractNumber: string; buyerName: string; country: string; riceType: string; quantity: number; pricePerTon: string; totalValue: string; status: string; }
interface LetterOfCredit { id: string; lcNumber: string; bankName: string; amount: string; status: string; expiryDate: string; }
interface ShippingDoc { id: string; documentType: string; referenceNumber: string; vesselName: string; portOfLoading: string; status: string; }

const contractColumns: Column<ExportContract>[] = [
  { key: "contractNumber", header: "Contract #" },
  { key: "buyerName", header: "Buyer" },
  { key: "country", header: "Country" },
  { key: "riceType", header: "Rice Type" },
  { key: "quantity", header: "Qty (tons)" },
  { key: "totalValue", header: "Value", render: (item) => `$${Number(item.totalValue).toLocaleString()}` },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge> },
];

const lcColumns: Column<LetterOfCredit>[] = [
  { key: "lcNumber", header: "LC #" },
  { key: "bankName", header: "Bank" },
  { key: "amount", header: "Amount", render: (item) => `$${Number(item.amount).toLocaleString()}` },
  { key: "expiryDate", header: "Expiry", render: (item) => new Date(item.expiryDate).toLocaleDateString() },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge> },
];

const shippingColumns: Column<ShippingDoc>[] = [
  { key: "documentType", header: "Type" },
  { key: "referenceNumber", header: "Reference #" },
  { key: "vesselName", header: "Vessel" },
  { key: "portOfLoading", header: "Port" },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function ExportSalesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ buyerName: "", country: "", riceType: "", quantity: "", pricePerTon: "" });

  const { data: contracts = [], isLoading: conLoading } = useApiList<ExportContract>(["export-contracts"], "/export-sales/contracts");
  const { data: lcs = [], isLoading: lcLoading } = useApiList<LetterOfCredit>(["lcs"], "/export-sales/lcs");
  const { data: docs = [], isLoading: docLoading } = useApiList<ShippingDoc>(["shipping-docs"], "/export-sales/shipping-documents");

  const createMutation = useApiMutation<ExportContract, unknown>("/export-sales/contracts", "post", [["export-contracts"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Export Sales" description="Export contracts, letters of credit, and shipping documents" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contracts" value={contracts.length} icon={Globe} />
        <StatCard title="Letters of Credit" value={lcs.length} icon={CreditCard} />
        <StatCard title="Shipping Docs" value={docs.length} icon={Ship} />
        <StatCard title="Active" value={contracts.filter((c) => c.status === "ACTIVE").length} icon={FileText} />
      </div>

      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts"><Globe className="mr-2 size-4" />Contracts</TabsTrigger>
          <TabsTrigger value="lcs"><CreditCard className="mr-2 size-4" />Letters of Credit</TabsTrigger>
          <TabsTrigger value="shipping"><Ship className="mr-2 size-4" />Shipping</TabsTrigger>
        </TabsList>
        <TabsContent value="contracts" className="space-y-4">
          <Button onClick={() => setShowCreate(true)}>+ New Contract</Button>
          <DataTable columns={contractColumns} data={contracts as unknown as ExportContract[]} isLoading={conLoading} />
        </TabsContent>
        <TabsContent value="lcs" className="space-y-4">
          <DataTable columns={lcColumns} data={lcs as unknown as LetterOfCredit[]} isLoading={lcLoading} />
        </TabsContent>
        <TabsContent value="shipping" className="space-y-4">
          <DataTable columns={shippingColumns} data={docs as unknown as ShippingDoc[]} isLoading={docLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Export Contract" onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity), pricePerTon: Number(form.pricePerTon), totalValue: Number(form.quantity) * Number(form.pricePerTon) }, { onSuccess: () => { setShowCreate(false); setForm({ buyerName: "", country: "", riceType: "", quantity: "", pricePerTon: "" }); } }); }} isLoading={createMutation.isPending}>
        <div className="space-y-2"><Label>Buyer Name</Label><Input value={form.buyerName} onChange={(e) => setForm((p) => ({ ...p, buyerName: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} required placeholder="e.g. UAE, Saudi Arabia" /></div>
        <div className="space-y-2"><Label>Rice Type</Label><Input value={form.riceType} onChange={(e) => setForm((p) => ({ ...p, riceType: e.target.value }))} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Quantity (tons)</Label><Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Price/Ton (USD)</Label><Input type="number" value={form.pricePerTon} onChange={(e) => setForm((p) => ({ ...p, pricePerTon: e.target.value }))} required /></div>
        </div>
      </FormDialog>
    </div>
  );
}
