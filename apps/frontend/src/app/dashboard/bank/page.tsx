"use client";

import { useState } from "react";
import { Landmark, ArrowUpDown, CheckSquare, Plus, CreditCard, BookOpen } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface BankAccount { id: string; bankName: string; accountNumber: string; accountType: string; balance: string; isActive: boolean; branchName: string; ifscCode: string; }
interface Reconciliation { id: string; bankAccountName: string; date: string; statementBalance: string; bookBalance: string; isReconciled: boolean; }
interface Cheque { id: string; chequeNumber: string; bankAccount: string; amount: string; date: string; status: string; partyName: string; type: string; }

const bankColumns: Column<BankAccount>[] = [
  { key: "bankName", header: "Bank" },
  { key: "accountNumber", header: "Account #", render: (item) => <span className="font-mono font-medium text-primary">{item.accountNumber}</span> },
  { key: "accountType", header: "Type", render: (item) => <Badge variant="outline">{item.accountType}</Badge> },
  { key: "branchName", header: "Branch", render: (item) => item.branchName ?? "—" },
  { key: "balance", header: "Balance", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.balance)}</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const reconColumns: Column<Reconciliation>[] = [
  { key: "bankAccountName", header: "Bank Account" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "statementBalance", header: "Statement", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.statementBalance)}</span> },
  { key: "bookBalance", header: "Books", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.bookBalance)}</span> },
  { key: "isReconciled", header: "Status", render: (item) => <Badge variant={item.isReconciled ? "default" : "secondary"} className={item.isReconciled ? "bg-emerald-600" : ""}>{item.isReconciled ? "Reconciled" : "Pending"}</Badge> },
];

const chequeColumns: Column<Cheque>[] = [
  { key: "chequeNumber", header: "Cheque #", render: (item) => <span className="font-mono font-medium text-primary">{item.chequeNumber}</span> },
  { key: "partyName", header: "Party" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "amount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  {
    key: "status", header: "Status", render: (item) => {
      const c: Record<string, string> = { ISSUED: "", CLEARED: "bg-emerald-600", BOUNCED: "bg-red-600", CANCELLED: "bg-gray-600" };
      return <Badge variant={item.status === "ISSUED" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

export default function BankPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountType: "CURRENT", branchName: "", ifscCode: "", openingBalance: 0 });

  const { data: accounts = [], isLoading: accLoading } = useApiList<BankAccount>(["bank-accounts"], "/bank-management/accounts");
  const { data: recons = [], isLoading: reconLoading } = useApiList<Reconciliation>(["reconciliations"], "/bank-management/reconciliations");
  const { data: cheques = [], isLoading: chequeLoading } = useApiList<Cheque>(["cheques"], "/bank-management/cheques");
  const createMutation = useApiMutation("/bank-management/accounts", "post", [["bank-accounts"]]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Management" description="Bank accounts, reconciliation, cheque management, and bank book" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bank Accounts" value={accounts.length} icon={Landmark} description={`${accounts.filter((a) => a.isActive).length} active`} />
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={ArrowUpDown} />
        <StatCard title="Reconciliations" value={recons.length} icon={CheckSquare} description={`${recons.filter((r) => r.isReconciled).length} reconciled`} />
        <StatCard title="Cheques" value={cheques.length} icon={CreditCard} description={`${cheques.filter((c) => c.status === "CLEARED").length} cleared`} />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="accounts" className="gap-1.5"><Landmark className="size-3.5" />Accounts</TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-1.5"><CheckSquare className="size-3.5" />Reconciliation</TabsTrigger>
          <TabsTrigger value="cheques" className="gap-1.5"><CreditCard className="size-3.5" />Cheques</TabsTrigger>
          <TabsTrigger value="bankbook" className="gap-1.5"><BookOpen className="size-3.5" />Bank Book</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <DataTable columns={bankColumns} data={accounts as unknown as BankAccount[]} isLoading={accLoading} emptyMessage="No bank accounts." searchPlaceholder="Search accounts..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />Add Account</Button>} />
        </TabsContent>
        <TabsContent value="reconciliation" className="space-y-4 mt-4">
          <DataTable columns={reconColumns} data={recons as unknown as Reconciliation[]} isLoading={reconLoading} emptyMessage="No reconciliation entries." searchPlaceholder="Search..." />
        </TabsContent>
        <TabsContent value="cheques" className="space-y-4 mt-4">
          <DataTable columns={chequeColumns} data={cheques as unknown as Cheque[]} isLoading={chequeLoading} emptyMessage="No cheques." searchPlaceholder="Search cheques..." />
        </TabsContent>
        <TabsContent value="bankbook" className="space-y-4 mt-4">
          <DataTable columns={bankColumns} data={accounts as unknown as BankAccount[]} isLoading={accLoading} emptyMessage="Select a bank account to view bank book." searchPlaceholder="Search..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Bank Account"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Bank account added"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Bank Name</Label><Input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} required placeholder="e.g. HBL" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Account Number</Label><Input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} required className="font-mono" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Account Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))}>
              <option value="CURRENT">Current</option><option value="SAVINGS">Savings</option><option value="FIXED_DEPOSIT">Fixed Deposit</option>
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Branch</Label><Input value={form.branchName} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">IFSC/Swift Code</Label><Input value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))} className="font-mono" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Opening Balance</Label><Input type="number" value={form.openingBalance || ""} onChange={(e) => setForm((p) => ({ ...p, openingBalance: Number(e.target.value) }))} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
