"use client";

import { Landmark, ArrowUpDown, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils/numbering";

interface BankAccount { id: string; bankName: string; accountNumber: string; accountType: string; balance: string; isActive: boolean; }
interface Reconciliation { id: string; bankAccountName: string; date: string; statementBalance: string; bookBalance: string; isReconciled: boolean; }

const bankColumns: Column<BankAccount>[] = [
  { key: "bankName", header: "Bank" },
  { key: "accountNumber", header: "Account #", render: (item) => <span className="font-mono font-medium text-primary">{item.accountNumber}</span> },
  { key: "accountType", header: "Type", render: (item) => <Badge variant="outline">{item.accountType}</Badge> },
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

export default function BankPage() {
  const { data: accounts = [], isLoading: accLoading } = useApiList<BankAccount>(["bank-accounts"], "/bank-management/accounts");
  const { data: recons = [], isLoading: reconLoading } = useApiList<Reconciliation>(["reconciliations"], "/bank-management/reconciliations");

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Management" description="Bank accounts, reconciliation, cheque management, and bank book" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Bank Accounts" value={accounts.length} icon={Landmark} description={`${accounts.filter((a) => a.isActive).length} active`} />
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={ArrowUpDown} />
        <StatCard title="Reconciliations" value={recons.length} icon={CheckSquare} description={`${recons.filter((r) => r.isReconciled).length} reconciled`} />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="accounts" className="gap-1.5"><Landmark className="size-3.5" />Accounts</TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-1.5"><CheckSquare className="size-3.5" />Reconciliation</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <DataTable columns={bankColumns} data={accounts as unknown as BankAccount[]} isLoading={accLoading} emptyMessage="No bank accounts." searchPlaceholder="Search accounts..." />
        </TabsContent>
        <TabsContent value="reconciliation" className="space-y-4 mt-4">
          <DataTable columns={reconColumns} data={recons as unknown as Reconciliation[]} isLoading={reconLoading} emptyMessage="No reconciliation entries." searchPlaceholder="Search..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
