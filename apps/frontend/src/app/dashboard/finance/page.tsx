"use client";

import { useState } from "react";
import {
  Wallet,
  BookOpen,
  Receipt,
  FileText,
  CreditCard,
  BarChart3,
  ArrowUpDown,
  Banknote,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation, useApiAction } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  balanceType: string;
  openingBalance: string;
  isGroup: boolean;
  isActive: boolean;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  narration: string;
  isPosted: boolean;
  lines: Array<{ accountId: string; debit: string; credit: string; narration: string }>;
}

interface SalesReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  invoiceType: string;
  totalAmount: string;
  isPosted: boolean;
  customerName: string;
}

interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface JELine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  narration: string;
}

const accountColumns: Column<Account>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium">{item.code}</span> },
  { key: "name", header: "Account Name" },
  {
    key: "accountType",
    header: "Type",
    render: (item) => {
      const colors: Record<string, string> = { ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", LIABILITY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", REVENUE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", EXPENSE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.accountType] ?? ""}`}>{item.accountType}</span>;
    },
  },
  { key: "balanceType", header: "Balance", render: (item) => <Badge variant="outline" className="text-xs">{item.balanceType}</Badge> },
  {
    key: "openingBalance",
    header: "Opening Balance",
    className: "text-right",
    render: (item) => <span className="font-mono">{formatCurrency(item.openingBalance)}</span>,
  },
  {
    key: "isActive",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>
        {item.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

const journalColumns: Column<JournalEntry>[] = [
  { key: "entryNumber", header: "Entry #", render: (item) => <span className="font-mono font-medium text-primary">{item.entryNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "narration", header: "Narration", render: (item) => <span className="max-w-[300px] truncate block">{item.narration}</span> },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"} className={item.isPosted ? "bg-emerald-600" : ""}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

const receiptColumns: Column<SalesReceipt>[] = [
  { key: "receiptNumber", header: "Receipt #", render: (item) => <span className="font-mono font-medium text-primary">{item.receiptNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  {
    key: "invoiceType",
    header: "Type",
    render: (item) => {
      const colors: Record<string, string> = { CASH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", CREDIT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", POS: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200", EXPORT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", TAX_INVOICE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", RETAIL: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.invoiceType] ?? ""}`}>{item.invoiceType}</span>;
    },
  },
  {
    key: "totalAmount",
    header: "Amount",
    className: "text-right",
    render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span>,
  },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"} className={item.isPosted ? "bg-emerald-600" : ""}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

function emptyJELine(): JELine {
  return { id: crypto.randomUUID(), accountId: "", debit: 0, credit: 0, narration: "" };
}

export default function FinancePage() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateJE, setShowCreateJE] = useState(false);
  const [showCreateReceipt, setShowCreateReceipt] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: "", name: "", accountType: "ASSET", balanceType: "DEBIT" });
  const [jeForm, setJeForm] = useState({ narration: "", date: todayISO() });
  const [jeLines, setJeLines] = useState<JELine[]>([emptyJELine(), emptyJELine()]);
  const [receiptForm, setReceiptForm] = useState({ customerId: "", invoiceType: "CASH", subtotal: "", totalAmount: "", date: todayISO() });

  const { data: accounts = [], isLoading: accountsLoading } = useApiList<Account>(["accounts"], "/finance/accounts");
  const { data: journals = [], isLoading: journalsLoading } = useApiList<JournalEntry>(["journal-entries"], "/finance/journal-entries");
  const { data: receipts = [], isLoading: receiptsLoading } = useApiList<SalesReceipt>(["sales-receipts"], "/finance/sales-receipts");
  const { data: fiscalYears = [] } = useApiList<FiscalYear>(["fiscal-years"], "/finance/fiscal-years");

  const seedMutation = useApiMutation("/finance/accounts/seed", "post", [["accounts"]]);
  const createAccountMutation = useApiMutation<Account, typeof accountForm>("/finance/accounts", "post", [["accounts"]]);
  const createJEMutation = useApiMutation<JournalEntry, unknown>("/finance/journal-entries", "post", [["journal-entries"]]);
  const postJEAction = useApiAction<unknown>([["journal-entries"]]);
  const createReceiptMutation = useApiMutation<SalesReceipt, unknown>("/finance/sales-receipts", "post", [["sales-receipts"]]);
  const postReceiptAction = useApiAction<unknown>([["sales-receipts"]]);

  const activeFY = fiscalYears.find((fy) => fy.isActive);
  const totalDebit = jeLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = jeLines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  return (
    <div className="space-y-6">
      <PageHeader title="Finance & Accounts" description="Chart of accounts, journal entries, vouchers, receipts, and financial reports" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Accounts" value={accounts.length} icon={BookOpen} description="Chart of accounts" />
        <StatCard title="Journal Entries" value={journals.length} icon={FileText} description={`${journals.filter((j) => j.isPosted).length} posted`} />
        <StatCard title="Sales Receipts" value={receipts.length} icon={Receipt} description={`${receipts.filter((r) => r.isPosted).length} posted`} />
        <StatCard title="Active Fiscal Year" value={activeFY?.name ?? "None"} icon={Wallet} description={activeFY ? `${new Date(activeFY.startDate).getFullYear()}` : "Set up fiscal year"} />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="accounts" className="gap-1.5"><BookOpen className="size-3.5" />Accounts</TabsTrigger>
          <TabsTrigger value="journals" className="gap-1.5"><ArrowUpDown className="size-3.5" />Journal Entries</TabsTrigger>
          <TabsTrigger value="receipts" className="gap-1.5"><Receipt className="size-3.5" />Receipts</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><BarChart3 className="size-3.5" />Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          <DataTable
            columns={accountColumns}
            data={accounts as unknown as Account[]}
            isLoading={accountsLoading}
            emptyMessage="No accounts found. Seed standard accounts to get started."
            searchPlaceholder="Search accounts..."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => seedMutation.mutate({} as never)} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? "Seeding..." : "Seed Standard Accounts"}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setShowCreateAccount(true)}>
                  <Plus className="size-3.5" />
                  New Account
                </Button>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="journals" className="space-y-4 mt-4">
          <DataTable
            columns={journalColumns}
            data={journals as unknown as JournalEntry[]}
            isLoading={journalsLoading}
            emptyMessage="No journal entries yet. Create your first entry."
            searchPlaceholder="Search entries..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateJE(true)}>
                <Plus className="size-3.5" />
                New Journal Entry
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4 mt-4">
          <DataTable
            columns={receiptColumns}
            data={receipts as unknown as SalesReceipt[]}
            isLoading={receiptsLoading}
            emptyMessage="No sales receipts yet."
            searchPlaceholder="Search receipts..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateReceipt(true)}>
                <Plus className="size-3.5" />
                New Sales Receipt
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Trial Balance", icon: BarChart3, desc: "Verify all debits equal credits" },
              { title: "Profit & Loss", icon: CreditCard, desc: "Income vs expenses overview" },
              { title: "Balance Sheet", icon: Banknote, desc: "Assets, liabilities, equity" },
              { title: "Cash Book", icon: BookOpen, desc: "All cash transactions" },
              { title: "Day Book", icon: FileText, desc: "Daily transaction register" },
              { title: "General Ledger", icon: Receipt, desc: "Complete account-wise ledger" },
            ].map((report) => (
              <Card key={report.title} className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <report.icon className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Account */}
      <FormDialog
        open={showCreateAccount}
        onOpenChange={setShowCreateAccount}
        title="Create Account"
        description="Add a new account to the chart of accounts"
        onSubmit={(e) => {
          e.preventDefault();
          createAccountMutation.mutate(accountForm, {
            onSuccess: () => {
              setShowCreateAccount(false);
              toast.success("Account created successfully");
              setAccountForm({ code: "", name: "", accountType: "ASSET", balanceType: "DEBIT" });
            },
          });
        }}
        isLoading={createAccountMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Account Code</Label>
            <Input value={accountForm.code} onChange={(e) => setAccountForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. 1110" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Account Name</Label>
            <Input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Cash in Hand" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={accountForm.accountType} onChange={(e) => setAccountForm((p) => ({ ...p, accountType: e.target.value }))}>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Balance Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={accountForm.balanceType} onChange={(e) => setAccountForm((p) => ({ ...p, balanceType: e.target.value }))}>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
        </div>
      </FormDialog>

      {/* Create Journal Entry — multi-line */}
      <FormDialog
        open={showCreateJE}
        onOpenChange={setShowCreateJE}
        title="Create Journal Entry"
        description={`Entry # ${generateNumber("journal-entry", journals.length)}`}
        size="xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isBalanced) {
            toast.error("Journal entry must be balanced — total debits must equal total credits");
            return;
          }
          createJEMutation.mutate(
            {
              date: jeForm.date,
              narration: jeForm.narration,
              lines: jeLines.filter((l) => l.accountId).map((l) => ({
                accountId: l.accountId,
                debit: l.debit,
                credit: l.credit,
                narration: l.narration,
              })),
            },
            {
              onSuccess: () => {
                setShowCreateJE(false);
                toast.success("Journal entry created successfully");
                setJeForm({ narration: "", date: todayISO() });
                setJeLines([emptyJELine(), emptyJELine()]);
              },
            }
          );
        }}
        isLoading={createJEMutation.isPending}
        submitLabel="Create Entry"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
            <Input type="date" value={jeForm.date} onChange={(e) => setJeForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Narration</Label>
            <Input value={jeForm.narration} onChange={(e) => setJeForm((p) => ({ ...p, narration: e.target.value }))} required placeholder="Description of the entry" />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider mb-3 block">Entry Lines</Label>
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-8 text-center text-xs">#</TableHead>
                  <TableHead className="text-xs min-w-[200px]">Account</TableHead>
                  <TableHead className="text-xs w-36 text-right">Debit</TableHead>
                  <TableHead className="text-xs w-36 text-right">Credit</TableHead>
                  <TableHead className="text-xs min-w-[150px]">Narration</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {jeLines.map((line, idx) => (
                  <TableRow key={line.id} className="group">
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell>
                      <select
                        className="w-full rounded-md border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-ring"
                        value={line.accountId}
                        onChange={(e) => setJeLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, accountId: e.target.value } : l)))}
                        required
                      >
                        <option value="">Select account...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) => setJeLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, debit: Number(e.target.value), credit: 0 } : l)))}
                        className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 bg-transparent font-mono"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) => setJeLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, credit: Number(e.target.value), debit: 0 } : l)))}
                        className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 bg-transparent font-mono"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.narration}
                        onChange={(e) => setJeLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, narration: e.target.value } : l)))}
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-1 bg-transparent"
                        placeholder="Line narration"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setJeLines((prev) => prev.filter((l) => l.id !== line.id))}
                        disabled={jeLines.length <= 2}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="text-right text-xs font-semibold uppercase tracking-wider">Total</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell colSpan={2}>
                    {totalDebit > 0 && (
                      <div className={`flex items-center gap-1 text-xs ${isBalanced ? "text-emerald-600" : "text-destructive"}`}>
                        <CheckCircle2 className="size-3" />
                        {isBalanced ? "Balanced" : `Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setJeLines((prev) => [...prev, emptyJELine()])} className="mt-3 gap-1.5">
            <Plus className="size-3.5" />
            Add Line
          </Button>
        </div>
      </FormDialog>

      {/* Create Sales Receipt */}
      <FormDialog
        open={showCreateReceipt}
        onOpenChange={setShowCreateReceipt}
        title="Create Sales Receipt"
        description={`Receipt # ${generateNumber("sales-receipt", receipts.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createReceiptMutation.mutate(
            {
              ...receiptForm,
              date: receiptForm.date,
              subtotal: Number(receiptForm.subtotal),
              totalAmount: Number(receiptForm.totalAmount || receiptForm.subtotal),
            },
            {
              onSuccess: () => {
                setShowCreateReceipt(false);
                toast.success("Sales receipt created successfully");
                setReceiptForm({ customerId: "", invoiceType: "CASH", subtotal: "", totalAmount: "", date: todayISO() });
              },
            }
          );
        }}
        isLoading={createReceiptMutation.isPending}
        submitLabel="Create Receipt"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
            <Input type="date" value={receiptForm.date} onChange={(e) => setReceiptForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Invoice Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={receiptForm.invoiceType} onChange={(e) => setReceiptForm((p) => ({ ...p, invoiceType: e.target.value }))}>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="POS">POS</option>
              <option value="EXPORT">Export</option>
              <option value="TAX_INVOICE">Tax Invoice</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Customer</Label>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={receiptForm.customerId} onChange={(e) => setReceiptForm((p) => ({ ...p, customerId: e.target.value }))} required>
            <option value="">Select customer...</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Subtotal</Label>
            <Input type="number" step="0.01" value={receiptForm.subtotal} onChange={(e) => setReceiptForm((p) => ({ ...p, subtotal: e.target.value, totalAmount: e.target.value }))} required placeholder="0.00" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Total Amount</Label>
            <Input type="number" step="0.01" value={receiptForm.totalAmount} onChange={(e) => setReceiptForm((p) => ({ ...p, totalAmount: e.target.value }))} required placeholder="0.00" className="font-mono" />
          </div>
        </div>
        {(receiptForm.invoiceType === "CASH" || receiptForm.invoiceType === "POS" || receiptForm.invoiceType === "RETAIL") && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="inline size-3.5 mr-1.5" />
            Auto-debit: Cash in Hand account will be automatically debited on posting.
          </div>
        )}
        {(receiptForm.invoiceType === "CREDIT" || receiptForm.invoiceType === "EXPORT" || receiptForm.invoiceType === "TAX_INVOICE") && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="inline size-3.5 mr-1.5" />
            Auto-debit: Accounts Receivable will be debited on posting.
          </div>
        )}
      </FormDialog>
    </div>
  );
}
