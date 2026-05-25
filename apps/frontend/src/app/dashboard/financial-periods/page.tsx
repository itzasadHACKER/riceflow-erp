"use client";

import { useState } from "react";
import { Calendar, Lock, Unlock, ShieldCheck, Wallet, Plus } from "lucide-react";
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

interface Period { id: string; periodNumber: number; name: string; status: string; startDate: string; endDate: string; closedAt: string; }
interface WhtConfig { id: string; code: string; name: string; rate: string; applicableTo: string; thresholdAmount: string; isActive: boolean; }
interface AdvPayment { id: string; paymentNumber: string; partnerType: string; amount: string; appliedAmount: string; remainingAmount: string; status: string; paymentMethod: string; }
interface Reconciliation { id: string; reconcNumber: string; partnerType: string; totalAmount: string; status: string; createdAt: string; }

const periodColumns: Column<Period>[] = [
  { key: "periodNumber", header: "#", render: (r) => <span className="font-mono font-semibold">{r.periodNumber}</span> },
  { key: "name", header: "Period" },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "OPEN" ? "bg-emerald-600" : r.status === "CLOSED" ? "bg-red-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "startDate", header: "Start", render: (r) => formatDate(r.startDate) },
  { key: "endDate", header: "End", render: (r) => formatDate(r.endDate) },
  { key: "closedAt", header: "Closed At", render: (r) => r.closedAt ? formatDate(r.closedAt) : "-" },
];

const whtColumns: Column<WhtConfig>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-mono font-semibold">{r.code}</span> },
  { key: "name", header: "Tax Name" },
  { key: "rate", header: "Rate", className: "text-right", render: (r) => <span className="font-mono">{r.rate}%</span> },
  { key: "applicableTo", header: "Applies To", render: (r) => <Badge variant="outline">{r.applicableTo}</Badge> },
  { key: "thresholdAmount", header: "Threshold", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.thresholdAmount)}</span> },
  { key: "isActive", header: "Active", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Yes" : "No"}</Badge> },
];

const advColumns: Column<AdvPayment>[] = [
  { key: "paymentNumber", header: "Payment #", render: (r) => <span className="font-mono font-semibold">{r.paymentNumber}</span> },
  { key: "partnerType", header: "Type", render: (r) => <Badge variant="outline">{r.partnerType}</Badge> },
  { key: "amount", header: "Amount", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.amount)}</span> },
  { key: "appliedAmount", header: "Applied", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.appliedAmount)}</span> },
  { key: "remainingAmount", header: "Remaining", className: "text-right", render: (r) => <span className="font-mono text-amber-600">{formatCurrency(r.remainingAmount)}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "FULLY_APPLIED" ? "bg-emerald-600" : r.status === "OPEN" ? "bg-blue-500" : "bg-amber-500"}>{r.status}</Badge> },
  { key: "paymentMethod", header: "Method", render: (r) => <Badge variant="outline">{r.paymentMethod.replace("_", " ")}</Badge> },
];

const reconColumns: Column<Reconciliation>[] = [
  { key: "reconcNumber", header: "Recon #", render: (r) => <span className="font-mono font-semibold">{r.reconcNumber}</span> },
  { key: "partnerType", header: "Partner Type", render: (r) => <Badge variant="outline">{r.partnerType}</Badge> },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.totalAmount)}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "RECONCILED" ? "bg-emerald-600" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

export default function FinancialPeriodsPage() {
  const [showWht, setShowWht] = useState(false);
  const [whtForm, setWhtForm] = useState({ name: "", code: "", rate: 0, applicableTo: "VENDOR", thresholdAmount: 0 });

  const { data: periods = [], isLoading } = useApiList<Period>(["fin-periods"], "/financial-enhancements/periods");
  const { data: whts = [] } = useApiList<WhtConfig>(["wht-configs"], "/financial-enhancements/withholding-tax");
  const { data: advances = [] } = useApiList<AdvPayment>(["advance-payments"], "/financial-enhancements/advance-payments");
  const { data: recons = [] } = useApiList<Reconciliation>(["reconciliations"], "/financial-enhancements/reconciliations");
  const { data: summary } = useApiList<any>(["fp-summary"], "/financial-enhancements/summary");

  const whtMut = useApiMutation("/financial-enhancements/withholding-tax", "post", { invalidateKeys: [["wht-configs"]], onSuccess: () => { setShowWht(false); toast.success("WHT config created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Enhancements" description="Period locking, withholding tax, advance payments, and internal reconciliation">
        <Button onClick={() => setShowWht(true)}><Plus className="mr-2 h-4 w-4" />Add WHT Config</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Periods" value={stats?.totalPeriods ?? 0} icon={Calendar} />
        <StatCard title="Open Periods" value={stats?.openPeriods ?? 0} icon={Unlock} trend="up" />
        <StatCard title="WHT Configs" value={stats?.withholdingTaxConfigs ?? 0} icon={ShieldCheck} />
        <StatCard title="Open Advances" value={stats?.openAdvances ?? 0} icon={Wallet} />
      </div>

      <Tabs defaultValue="periods" className="space-y-4">
        <TabsList><TabsTrigger value="periods">Financial Periods</TabsTrigger><TabsTrigger value="wht">Withholding Tax</TabsTrigger><TabsTrigger value="advances">Advance Payments</TabsTrigger><TabsTrigger value="recons">Internal Reconciliation</TabsTrigger></TabsList>
        <TabsContent value="periods"><DataTable columns={periodColumns} data={periods} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="wht"><DataTable columns={whtColumns} data={whts}  /></TabsContent>
        <TabsContent value="advances"><DataTable columns={advColumns} data={advances}  /></TabsContent>
        <TabsContent value="recons"><DataTable columns={reconColumns} data={recons}  /></TabsContent>
      </Tabs>

      <FormDialog open={showWht} onOpenChange={setShowWht} title="New Withholding Tax Config" onSubmit={() => whtMut.mutate(whtForm)} isLoading={whtMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Code</Label><Input value={whtForm.code} onChange={(e) => setWhtForm({ ...whtForm, code: e.target.value })} placeholder="e.g. WHT-001" /></div><div><Label>Name</Label><Input value={whtForm.name} onChange={(e) => setWhtForm({ ...whtForm, name: e.target.value })} placeholder="e.g. Advance Tax" /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Rate (%)</Label><Input type="number" value={whtForm.rate} onChange={(e) => setWhtForm({ ...whtForm, rate: Number(e.target.value) })} /></div><div><Label>Threshold Amount</Label><Input type="number" value={whtForm.thresholdAmount} onChange={(e) => setWhtForm({ ...whtForm, thresholdAmount: Number(e.target.value) })} /></div></div>
        </div>
      </FormDialog>
    </div>
  );
}
