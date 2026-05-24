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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation, useApiAction } from "@/hooks/use-api";

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
}

interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const accountColumns: Column<Account>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Account Name" },
  {
    key: "accountType",
    header: "Type",
    render: (item) => (
      <Badge variant="outline">{item.accountType}</Badge>
    ),
  },
  { key: "balanceType", header: "Balance" },
  {
    key: "openingBalance",
    header: "Opening Balance",
    render: (item) =>
      Number(item.openingBalance).toLocaleString("en-PK", {
        style: "currency",
        currency: "PKR",
      }),
  },
  {
    key: "isActive",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isActive ? "default" : "secondary"}>
        {item.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

const journalColumns: Column<JournalEntry>[] = [
  { key: "entryNumber", header: "Entry #" },
  {
    key: "date",
    header: "Date",
    render: (item) => new Date(item.date).toLocaleDateString(),
  },
  { key: "narration", header: "Narration" },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

const receiptColumns: Column<SalesReceipt>[] = [
  { key: "receiptNumber", header: "Receipt #" },
  {
    key: "date",
    header: "Date",
    render: (item) => new Date(item.date).toLocaleDateString(),
  },
  {
    key: "invoiceType",
    header: "Type",
    render: (item) => <Badge variant="outline">{item.invoiceType}</Badge>,
  },
  {
    key: "totalAmount",
    header: "Amount",
    render: (item) =>
      Number(item.totalAmount).toLocaleString("en-PK", {
        style: "currency",
        currency: "PKR",
      }),
  },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

export default function FinancePage() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateJE, setShowCreateJE] = useState(false);
  const [showCreateReceipt, setShowCreateReceipt] = useState(false);
  const [accountForm, setAccountForm] = useState({
    code: "",
    name: "",
    accountType: "ASSET",
    balanceType: "DEBIT",
  });
  const [jeForm, setJeForm] = useState({
    narration: "",
    date: new Date().toISOString().split("T")[0],
    debitAccount: "",
    creditAccount: "",
    amount: "",
  });
  const [receiptForm, setReceiptForm] = useState({
    customerId: "",
    invoiceType: "CASH",
    subtotal: "",
    totalAmount: "",
  });

  const { data: accounts = [], isLoading: accountsLoading } =
    useApiList<Account>(["accounts"], "/finance/accounts");
  const { data: journals = [], isLoading: journalsLoading } =
    useApiList<JournalEntry>(["journal-entries"], "/finance/journal-entries");
  const { data: receipts = [], isLoading: receiptsLoading } =
    useApiList<SalesReceipt>(["sales-receipts"], "/finance/sales-receipts");
  const { data: fiscalYears = [] } =
    useApiList<FiscalYear>(["fiscal-years"], "/finance/fiscal-years");

  const seedMutation = useApiMutation("/finance/accounts/seed", "post", [
    ["accounts"],
  ]);
  const createAccountMutation = useApiMutation<Account, typeof accountForm>(
    "/finance/accounts",
    "post",
    [["accounts"]]
  );
  const createJEMutation = useApiMutation<JournalEntry, unknown>(
    "/finance/journal-entries",
    "post",
    [["journal-entries"]]
  );
  const postJEAction = useApiAction<unknown>([["journal-entries"]]);
  const createReceiptMutation = useApiMutation<SalesReceipt, unknown>(
    "/finance/sales-receipts",
    "post",
    [["sales-receipts"]]
  );
  const postReceiptAction = useApiAction<unknown>([["sales-receipts"]]);

  const activeFY = fiscalYears.find((fy) => fy.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Accounts"
        description="Chart of accounts, journal entries, vouchers, receipts, and financial reports"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={accounts.length}
          icon={BookOpen}
          description="Chart of accounts"
        />
        <StatCard
          title="Journal Entries"
          value={journals.length}
          icon={FileText}
          description={`${journals.filter((j) => j.isPosted).length} posted`}
        />
        <StatCard
          title="Sales Receipts"
          value={receipts.length}
          icon={Receipt}
          description={`${receipts.filter((r) => r.isPosted).length} posted`}
        />
        <StatCard
          title="Active Fiscal Year"
          value={activeFY?.name ?? "None"}
          icon={Wallet}
          description={activeFY ? `${new Date(activeFY.startDate).getFullYear()}` : "Set up fiscal year"}
        />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">
            <BookOpen className="mr-2 size-4" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journals">
            <ArrowUpDown className="mr-2 size-4" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Receipt className="mr-2 size-4" />
            Sales Receipts
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="mr-2 size-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateAccount(true)}>
              + New Account
            </Button>
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate({} as never)}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? "Seeding..." : "Seed Standard Accounts"}
            </Button>
          </div>
          <DataTable
            columns={accountColumns}
            data={accounts as unknown as Account[]}
            isLoading={accountsLoading}
            emptyMessage="No accounts found. Click 'Seed Standard Accounts' to create the default chart of accounts."
          />
        </TabsContent>

        <TabsContent value="journals" className="space-y-4">
          <Button onClick={() => setShowCreateJE(true)}>
            + New Journal Entry
          </Button>
          <DataTable
            columns={journalColumns}
            data={journals as unknown as JournalEntry[]}
            isLoading={journalsLoading}
            emptyMessage="No journal entries yet."
          />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Button onClick={() => setShowCreateReceipt(true)}>
            + New Sales Receipt
          </Button>
          <DataTable
            columns={receiptColumns}
            data={receipts as unknown as SalesReceipt[]}
            isLoading={receiptsLoading}
            emptyMessage="No sales receipts yet."
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Trial Balance", icon: BarChart3, href: "#" },
              { title: "Profit & Loss", icon: CreditCard, href: "#" },
              { title: "Balance Sheet", icon: Banknote, href: "#" },
              { title: "Cash Book", icon: BookOpen, href: "#" },
              { title: "Day Book", icon: FileText, href: "#" },
              { title: "General Ledger", icon: Receipt, href: "#" },
            ].map((report) => (
              <Card key={report.title} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <report.icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View {report.title.toLowerCase()} report
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateAccount}
        onOpenChange={setShowCreateAccount}
        title="Create Account"
        onSubmit={(e) => {
          e.preventDefault();
          createAccountMutation.mutate(accountForm, {
            onSuccess: () => {
              setShowCreateAccount(false);
              setAccountForm({ code: "", name: "", accountType: "ASSET", balanceType: "DEBIT" });
            },
          });
        }}
        isLoading={createAccountMutation.isPending}
      >
        <div className="space-y-2">
          <Label>Account Code</Label>
          <Input value={accountForm.code} onChange={(e) => setAccountForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. 1110" />
        </div>
        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Cash in Hand" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={accountForm.accountType} onChange={(e) => setAccountForm((p) => ({ ...p, accountType: e.target.value }))}>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Balance Type</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={accountForm.balanceType} onChange={(e) => setAccountForm((p) => ({ ...p, balanceType: e.target.value }))}>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={showCreateJE}
        onOpenChange={setShowCreateJE}
        title="Create Journal Entry"
        onSubmit={(e) => {
          e.preventDefault();
          createJEMutation.mutate(
            {
              date: jeForm.date,
              narration: jeForm.narration,
              lines: [
                { accountId: jeForm.debitAccount, debit: Number(jeForm.amount), credit: 0, narration: jeForm.narration },
                { accountId: jeForm.creditAccount, debit: 0, credit: Number(jeForm.amount), narration: jeForm.narration },
              ],
            },
            {
              onSuccess: () => {
                setShowCreateJE(false);
                setJeForm({ narration: "", date: new Date().toISOString().split("T")[0], debitAccount: "", creditAccount: "", amount: "" });
              },
            }
          );
        }}
        isLoading={createJEMutation.isPending}
      >
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={jeForm.date} onChange={(e) => setJeForm((p) => ({ ...p, date: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label>Narration</Label>
          <Input value={jeForm.narration} onChange={(e) => setJeForm((p) => ({ ...p, narration: e.target.value }))} required placeholder="Description of the entry" />
        </div>
        <div className="space-y-2">
          <Label>Debit Account</Label>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={jeForm.debitAccount} onChange={(e) => setJeForm((p) => ({ ...p, debitAccount: e.target.value }))} required>
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Credit Account</Label>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={jeForm.creditAccount} onChange={(e) => setJeForm((p) => ({ ...p, creditAccount: e.target.value }))} required>
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" min="0" step="0.01" value={jeForm.amount} onChange={(e) => setJeForm((p) => ({ ...p, amount: e.target.value }))} required placeholder="0.00" />
        </div>
      </FormDialog>

      <FormDialog
        open={showCreateReceipt}
        onOpenChange={setShowCreateReceipt}
        title="Create Sales Receipt"
        onSubmit={(e) => {
          e.preventDefault();
          createReceiptMutation.mutate(
            {
              customerId: receiptForm.customerId,
              invoiceType: receiptForm.invoiceType,
              items: [{ description: "Sale", qty: 1, rate: Number(receiptForm.totalAmount) }],
              subtotal: Number(receiptForm.subtotal || receiptForm.totalAmount),
              taxAmount: 0,
              discount: 0,
              totalAmount: Number(receiptForm.totalAmount),
            },
            {
              onSuccess: () => {
                setShowCreateReceipt(false);
                setReceiptForm({ customerId: "", invoiceType: "CASH", subtotal: "", totalAmount: "" });
              },
            }
          );
        }}
        isLoading={createReceiptMutation.isPending}
      >
        <div className="space-y-2">
          <Label>Invoice Type</Label>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={receiptForm.invoiceType} onChange={(e) => setReceiptForm((p) => ({ ...p, invoiceType: e.target.value }))}>
            <option value="CASH">Cash</option>
            <option value="CREDIT">Credit</option>
            <option value="POS">POS</option>
            <option value="EXPORT">Export</option>
            <option value="TAX_INVOICE">Tax Invoice</option>
            <option value="RETAIL">Retail</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Total Amount</Label>
          <Input type="number" min="0" step="0.01" value={receiptForm.totalAmount} onChange={(e) => setReceiptForm((p) => ({ ...p, totalAmount: e.target.value, subtotal: e.target.value }))} required placeholder="0.00" />
        </div>
      </FormDialog>
    </div>
  );
}
