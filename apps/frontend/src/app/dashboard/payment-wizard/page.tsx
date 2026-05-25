"use client";

import { useState } from "react";
import { CreditCard, Bell, AlertTriangle, Play, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface PaymentRun { id: string; runNumber: string; type: string; status: string; paymentMethod: string; totalAmount: string; paymentsCount: number; processedAt: string; createdAt: string; }
interface DunningLevel { id: string; level: number; name: string; daysOverdue: number; chargePercent: string; chargeAmount: string; isActive: boolean; }
interface DunningRun { id: string; customersCount: number; totalOverdue: string; createdAt: string; }

const payRunColumns: Column<PaymentRun>[] = [
  { key: "runNumber", header: "Run #", render: (r) => <span className="font-mono font-semibold">{r.runNumber}</span> },
  { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
  { key: "paymentMethod", header: "Method", render: (r) => <Badge variant="outline">{r.paymentMethod.replace("_", " ")}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "PROCESSED" ? "bg-emerald-600" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "paymentsCount", header: "Payments", className: "text-right", render: (r) => <span className="font-mono">{r.paymentsCount}</span> },
  { key: "totalAmount", header: "Total", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.totalAmount)}</span> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

const dlColumns: Column<DunningLevel>[] = [
  { key: "level", header: "Level", render: (r) => <span className="font-mono font-semibold">L{r.level}</span> },
  { key: "name", header: "Name" },
  { key: "daysOverdue", header: "Days Overdue", className: "text-right", render: (r) => <span className="font-mono">{r.daysOverdue} days</span> },
  { key: "chargePercent", header: "Charge %", className: "text-right", render: (r) => <span className="font-mono">{r.chargePercent}%</span> },
  { key: "chargeAmount", header: "Flat Charge", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.chargeAmount)}</span> },
  { key: "isActive", header: "Active", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Yes" : "No"}</Badge> },
];

const drColumns: Column<DunningRun>[] = [
  { key: "customersCount", header: "Customers", className: "text-right", render: (r) => <span className="font-mono">{r.customersCount}</span> },
  { key: "totalOverdue", header: "Total Overdue", className: "text-right", render: (r) => <span className="font-mono font-semibold text-red-600">{formatCurrency(r.totalOverdue)}</span> },
  { key: "createdAt", header: "Run Date", render: (r) => formatDate(r.createdAt) },
];

export default function PaymentWizardPage() {
  const [showPay, setShowPay] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [payForm, setPayForm] = useState({ type: "OUTGOING", paymentMethod: "BANK_TRANSFER" });
  const [levelForm, setLevelForm] = useState({ level: 1, name: "", daysOverdue: 30, chargePercent: 0, chargeAmount: 0 });

  const { data: payRuns = [], isLoading } = useApiList<PaymentRun>(["payment-runs"], "/payment-wizard/payment-runs");
  const { data: levels = [] } = useApiList<DunningLevel>(["dunning-levels"], "/payment-wizard/dunning-levels");
  const { data: dunRuns = [] } = useApiList<DunningRun>(["dunning-runs"], "/payment-wizard/dunning-runs");
  const { data: summary } = useApiList<any>(["pw-summary"], "/payment-wizard/summary");

  const payMut = useApiMutation("/payment-wizard/payment-runs", "post", { invalidateKeys: [["payment-runs"], ["pw-summary"]], onSuccess: () => { setShowPay(false); toast.success("Payment run created"); } });
  const levelMut = useApiMutation("/payment-wizard/dunning-levels", "post", { invalidateKeys: [["dunning-levels"]], onSuccess: () => { setShowLevel(false); toast.success("Dunning level created"); } });
  const dunMut = useApiMutation("/payment-wizard/dunning-runs", "post", { invalidateKeys: [["dunning-runs"], ["pw-summary"]], onSuccess: () => { toast.success("Dunning run completed"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Wizard & Dunning" description="Batch payment processing and automated payment reminders">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => dunMut.mutate({})}><Bell className="mr-2 h-4 w-4" />Run Dunning</Button>
          <Button onClick={() => setShowPay(true)}><Play className="mr-2 h-4 w-4" />New Payment Run</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Payment Runs" value={stats?.totalPaymentRuns ?? 0} icon={CreditCard} />
        <StatCard title="Pending Runs" value={stats?.pendingRuns ?? 0} icon={CreditCard} />
        <StatCard title="Dunning Levels" value={stats?.dunningLevels ?? 0} icon={AlertTriangle} />
        <StatCard title="Dunning Runs" value={stats?.totalDunningRuns ?? 0} icon={Bell} />
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList><TabsTrigger value="payments">Payment Runs</TabsTrigger><TabsTrigger value="levels">Dunning Levels</TabsTrigger><TabsTrigger value="dunning">Dunning Runs</TabsTrigger></TabsList>
        <TabsContent value="payments"><DataTable columns={payRunColumns} data={payRuns} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="levels">
          <div className="mb-4"><Button size="sm" onClick={() => setShowLevel(true)}><Plus className="mr-2 h-4 w-4" />Add Dunning Level</Button></div>
          <DataTable columns={dlColumns} data={levels}  />
        </TabsContent>
        <TabsContent value="dunning"><DataTable columns={drColumns} data={dunRuns} /></TabsContent>
      </Tabs>

      <FormDialog open={showPay} onOpenChange={setShowPay} title="New Payment Run" onSubmit={() => payMut.mutate(payForm)} isLoading={payMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Type</Label><Select value={payForm.type} onValueChange={(v) => setPayForm({ ...payForm, type: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OUTGOING">Outgoing (Vendor Payments)</SelectItem><SelectItem value="INCOMING">Incoming (Customer Receipts)</SelectItem></SelectContent></Select></div>
          <div><Label>Payment Method</Label><Select value={payForm.paymentMethod} onValueChange={(v) => setPayForm({ ...payForm, paymentMethod: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem><SelectItem value="CHECK">Check</SelectItem><SelectItem value="CASH">Cash</SelectItem></SelectContent></Select></div>
        </div>
      </FormDialog>

      <FormDialog open={showLevel} onOpenChange={setShowLevel} title="New Dunning Level" onSubmit={() => levelMut.mutate(levelForm)} isLoading={levelMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Level</Label><Input type="number" value={levelForm.level} onChange={(e) => setLevelForm({ ...levelForm, level: Number(e.target.value) })} /></div><div><Label>Name</Label><Input value={levelForm.name} onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })} placeholder="e.g. First Reminder" /></div></div>
          <div><Label>Days Overdue</Label><Input type="number" value={levelForm.daysOverdue} onChange={(e) => setLevelForm({ ...levelForm, daysOverdue: Number(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Charge %</Label><Input type="number" value={levelForm.chargePercent} onChange={(e) => setLevelForm({ ...levelForm, chargePercent: Number(e.target.value) })} /></div><div><Label>Flat Charge</Label><Input type="number" value={levelForm.chargeAmount} onChange={(e) => setLevelForm({ ...levelForm, chargeAmount: Number(e.target.value) })} /></div></div>
        </div>
      </FormDialog>
    </div>
  );
}
