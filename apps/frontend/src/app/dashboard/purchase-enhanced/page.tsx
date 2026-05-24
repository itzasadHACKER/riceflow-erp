"use client";

import { useState } from "react";
import { FileCheck, Scale, Handshake, Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface BlanketAgreement { id: string; agreementNumber: string; partnerId: string; startDate: string; endDate: string; status: string; plannedAmount: string; fulfilledAmount: string; }
interface Supplier { id: string; name: string; }
interface MatchResult { purchaseOrder: { id: string; number: string; total: number }; goodsReceipts: { count: number; total: number }; invoices: { count: number; total: number }; matching: { isMatched: boolean; status: string; poVsGrVariance: number; poVsInvoiceVariance: number }; }

const baColumns: Column<BlanketAgreement>[] = [
  { key: "agreementNumber", header: "Agreement #", render: (i) => <span className="font-mono font-medium text-primary">{i.agreementNumber}</span> },
  { key: "startDate", header: "Start", render: (i) => formatDate(i.startDate) },
  { key: "endDate", header: "End", render: (i) => formatDate(i.endDate) },
  { key: "plannedAmount", header: "Planned", render: (i) => <span className="font-mono">{formatCurrency(i.plannedAmount)}</span> },
  { key: "fulfilledAmount", header: "Fulfilled", render: (i) => <span className="font-mono">{formatCurrency(i.fulfilledAmount)}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "ACTIVE" ? "default" : "secondary"}>{i.status}</Badge> },
];

export default function PurchaseEnhancedPage() {
  const [baOpen, setBaOpen] = useState(false);
  const [matchPoId, setMatchPoId] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [lcOpen, setLcOpen] = useState(false);

  const { data: agreements = [], refetch: refetchBa } = useApiList<BlanketAgreement>(["purchase-blanket-agreements"], "/purchase-enhanced/blanket-agreements");
  const { data: suppliers = [] } = useApiList<Supplier>(["pe-suppliers"], "/procurement/suppliers");

  const createBa = useApiMutation("/purchase-enhanced/blanket-agreements", "post");
  const calcLandedCosts = useApiMutation("/purchase-enhanced/landed-costs", "post");

  const baList = Array.isArray(agreements) ? agreements : [];

  const handleMatch = async () => {
    if (!matchPoId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/purchase-enhanced/three-way-match/${matchPoId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setMatchResult(data.data || data);
    } catch { toast.error("Match failed"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Enhancements" description="3-Way matching, landed costs, blanket agreements, AP credit memos, goods returns" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Blanket Agreements" value={baList.length} icon={Handshake} description="Vendor contracts" />
        <StatCard title="3-Way Matching" value="Tool" icon={FileCheck} description="PO ↔ GR ↔ Invoice" />
        <StatCard title="Landed Costs" value="Calculator" icon={Scale} description="Cost allocation" />
      </div>

      <Tabs defaultValue="blanket" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blanket">Blanket Agreements</TabsTrigger>
          <TabsTrigger value="matching">3-Way Matching</TabsTrigger>
          <TabsTrigger value="landed-costs">Landed Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="blanket" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setBaOpen(true)}><Plus className="mr-2 h-4 w-4" />New Agreement</Button>
          </div>
          <DataTable columns={baColumns} data={baList} />
          <FormDialog open={baOpen} onOpenChange={setBaOpen} title="Create Purchase Blanket Agreement" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createBa.mutateAsync({ supplierId: fd.get("supplierId"), startDate: fd.get("startDate"), endDate: fd.get("endDate"), plannedAmount: Number(fd.get("plannedAmount")), description: fd.get("description"), method: fd.get("method") });
            toast.success("Agreement created"); setBaOpen(false); refetchBa();
          }}>
            <div className="grid gap-4">
              <div><Label>Supplier</Label>
                <Select name="supplierId"><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input name="startDate" type="date" defaultValue={todayISO()} /></div>
                <div><Label>End Date</Label><Input name="endDate" type="date" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Planned Amount</Label><Input name="plannedAmount" type="number" step="0.01" required /></div>
                <div><Label>Method</Label>
                  <Select name="method"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="AMOUNT">By Amount</SelectItem><SelectItem value="ITEMS">By Items</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Input name="description" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />3-Way Matching</CardTitle>
              <CardDescription>Compare Purchase Order vs Goods Receipt vs Vendor Invoice to detect variances.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div><Label>Purchase Order ID</Label><Input value={matchPoId} onChange={(e) => setMatchPoId(e.target.value)} placeholder="Enter PO ID" /></div>
                <div className="flex items-end col-span-2"><Button onClick={handleMatch}><Search className="mr-2 h-4 w-4" />Run 3-Way Match</Button></div>
              </div>
              {matchResult && (
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <p className="text-xs text-blue-600 uppercase tracking-wider">Purchase Order</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(matchResult.purchaseOrder.total)}</p>
                      <p className="text-xs">{matchResult.purchaseOrder.number}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <p className="text-xs text-green-600 uppercase tracking-wider">Goods Receipts ({matchResult.goodsReceipts.count})</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(matchResult.goodsReceipts.total)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <p className="text-xs text-purple-600 uppercase tracking-wider">Invoices ({matchResult.invoices.count})</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(matchResult.invoices.total)}</p>
                    </CardContent>
                  </Card>
                  <Card className={`col-span-3 ${matchResult.matching.isMatched ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={matchResult.matching.isMatched ? "default" : "destructive"} className="text-sm">{matchResult.matching.status}</Badge>
                          <p className="text-sm mt-1">PO↔GR Variance: {formatCurrency(matchResult.matching.poVsGrVariance)} | PO↔Invoice Variance: {formatCurrency(matchResult.matching.poVsInvoiceVariance)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landed-costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Scale className="h-5 w-5" />Landed Costs Calculator</span>
                <Button onClick={() => setLcOpen(true)}><Plus className="mr-2 h-4 w-4" />Calculate</Button>
              </CardTitle>
              <CardDescription>Distribute freight, customs, and insurance costs proportionally across purchased items.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-amber-50">
                <p className="text-sm font-medium">Cost allocation methods:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>By Quantity: Distribute costs by item quantity proportion</li>
                  <li>By Value: Distribute costs by item value proportion</li>
                  <li>Equal: Distribute costs equally across all items</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <FormDialog open={lcOpen} onOpenChange={setLcOpen} title="Calculate Landed Costs" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await calcLandedCosts.mutateAsync({
              goodsReceiptId: fd.get("goodsReceiptId"),
              costs: [
                { type: "FREIGHT", amount: Number(fd.get("freight") || 0), description: "Freight charges" },
                { type: "CUSTOMS", amount: Number(fd.get("customs") || 0), description: "Customs duty" },
                { type: "INSURANCE", amount: Number(fd.get("insurance") || 0), description: "Insurance" },
              ].filter(c => c.amount > 0),
            });
            toast.success("Landed costs calculated"); setLcOpen(false);
          }}>
            <div className="grid gap-4">
              <div><Label>Goods Receipt ID</Label><Input name="goodsReceiptId" required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Freight</Label><Input name="freight" type="number" step="0.01" defaultValue="0" /></div>
                <div><Label>Customs Duty</Label><Input name="customs" type="number" step="0.01" defaultValue="0" /></div>
                <div><Label>Insurance</Label><Input name="insurance" type="number" step="0.01" defaultValue="0" /></div>
              </div>
            </div>
          </FormDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
