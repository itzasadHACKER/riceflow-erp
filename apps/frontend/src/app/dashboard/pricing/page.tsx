"use client";

import { useState } from "react";
import { Tag, Percent, Star, Plus } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface PriceList { id: string; name: string; currency: string; isDefault: boolean; validFrom: string; validTo: string; items: any[]; }
interface DiscountGroup { id: string; name: string; type: string; isActive: boolean; tiers: any[]; }
interface SpecialPrice { id: string; partnerId: string; partnerType: string; itemCode: string; price: string; discountPercent: string; validFrom: string; validTo: string; }

const plColumns: Column<PriceList>[] = [
  { key: "name", header: "Price List" },
  { key: "currency", header: "Currency", render: (r) => <Badge variant="outline">{r.currency}</Badge> },
  { key: "isDefault", header: "Default", render: (r) => r.isDefault ? <Badge className="bg-emerald-600">Default</Badge> : <span className="text-slate-400">-</span> },
  { key: "items", header: "Items", className: "text-right", render: (r) => <span className="font-mono">{r.items?.length || 0}</span> },
  { key: "validFrom", header: "Valid From", render: (r) => r.validFrom ? formatDate(r.validFrom) : "-" },
  { key: "validTo", header: "Valid To", render: (r) => r.validTo ? formatDate(r.validTo) : "-" },
];

const dgColumns: Column<DiscountGroup>[] = [
  { key: "name", header: "Group Name" },
  { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
  { key: "tiers", header: "Tiers", className: "text-right", render: (r) => <span className="font-mono">{r.tiers?.length || 0}</span> },
  { key: "isActive", header: "Status", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
];

const spColumns: Column<SpecialPrice>[] = [
  { key: "itemCode", header: "Item Code" },
  { key: "partnerType", header: "Partner Type", render: (r) => <Badge variant="outline">{r.partnerType}</Badge> },
  { key: "price", header: "Special Price", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.price)}</span> },
  { key: "discountPercent", header: "Discount %", className: "text-right", render: (r) => r.discountPercent ? <span className="font-mono text-emerald-600">{r.discountPercent}%</span> : "-" },
  { key: "validFrom", header: "Valid From", render: (r) => r.validFrom ? formatDate(r.validFrom) : "-" },
  { key: "validTo", header: "Valid To", render: (r) => r.validTo ? formatDate(r.validTo) : "-" },
];

export default function PricingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", currency: "PKR", isDefault: false });

  const { data: priceLists = [], isLoading } = useApiList<PriceList>(["price-lists"], "/pricing/price-lists");
  const { data: discountGroups = [] } = useApiList<DiscountGroup>(["discount-groups"], "/pricing/discount-groups");
  const { data: specialPrices = [] } = useApiList<SpecialPrice>(["special-prices"], "/pricing/special-prices");
  const { data: summary } = useApiList<any>(["pricing-summary"], "/pricing/summary");

  const createMut = useApiMutation("/pricing/price-lists", "post", { invalidateKeys: [["price-lists"], ["pricing-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Price list created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Pricing" description="Price lists, volume discounts, and customer-specific pricing">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Price List</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Price Lists" value={stats?.priceLists ?? 0} icon={Tag} />
        <StatCard title="Discount Groups" value={stats?.discountGroups ?? 0} icon={Percent} />
        <StatCard title="Special Prices" value={stats?.specialPrices ?? 0} icon={Star} />
      </div>

      <Tabs defaultValue="price-lists" className="space-y-4">
        <TabsList><TabsTrigger value="price-lists">Price Lists</TabsTrigger><TabsTrigger value="discounts">Discount Groups</TabsTrigger><TabsTrigger value="special">Special Prices</TabsTrigger></TabsList>
        <TabsContent value="price-lists"><DataTable columns={plColumns} data={priceLists} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="discounts"><DataTable columns={dgColumns} data={discountGroups}  /></TabsContent>
        <TabsContent value="special"><DataTable columns={spColumns} data={specialPrices}  /></TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Price List" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Retail" /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
