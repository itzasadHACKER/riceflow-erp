"use client";

import { useState } from "react";
import { Receipt, CreditCard, Plus, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface ExpenseCategory { id: string; name: string; code: string; description: string; }
interface ExpenseEntry { id: string; expenseNumber: string; date: string; categoryName: string; amount: string; description: string; status: string; }

const categoryColumns: Column<ExpenseCategory>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Category Name" },
  { key: "description", header: "Description" },
];

const expenseColumns: Column<ExpenseEntry>[] = [
  { key: "expenseNumber", header: "Expense #", render: (item) => <span className="font-mono font-medium text-primary">{item.expenseNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "categoryName", header: "Category" },
  { key: "amount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span> },
  { key: "description", header: "Description", render: (item) => <span className="max-w-[200px] truncate block">{item.description}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { PENDING: "", APPROVED: "bg-emerald-600", REJECTED: "bg-red-600" };
      return <Badge variant={item.status === "PENDING" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

export default function ExpensePage() {
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [expForm, setExpForm] = useState({ categoryId: "", date: todayISO(), amount: "", description: "" });
  const [catForm, setCatForm] = useState({ name: "", code: "", description: "" });

  const { data: categories = [], isLoading: catLoading } = useApiList<ExpenseCategory>(["expense-categories"], "/expense/categories");
  const { data: expenses = [], isLoading: expLoading } = useApiList<ExpenseEntry>(["expenses"], "/expense/entries");

  const createExpMutation = useApiMutation<ExpenseEntry, unknown>("/expense/entries", "post", [["expenses"]]);
  const createCatMutation = useApiMutation<ExpenseCategory, typeof catForm>("/expense/categories", "post", [["expense-categories"]]);

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Expense Management" description="Expense categories, claims, cash payment vouchers, and receipt tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Categories" value={categories.length} icon={PieChart} />
        <StatCard title="Expense Claims" value={expenses.length} icon={Receipt} description={`${expenses.filter((e) => e.status === "PENDING").length} pending`} />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpense)} icon={CreditCard} />
        <StatCard title="Approved" value={expenses.filter((e) => e.status === "APPROVED").length} icon={Receipt} />
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="expenses" className="gap-1.5"><Receipt className="size-3.5" />Expenses</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><PieChart className="size-3.5" />Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <DataTable
            columns={expenseColumns}
            data={expenses as unknown as ExpenseEntry[]}
            isLoading={expLoading}
            emptyMessage="No expense entries yet."
            searchPlaceholder="Search expenses..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateExpense(true)}>
                <Plus className="size-3.5" />
                New Expense
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <DataTable
            columns={categoryColumns}
            data={categories as unknown as ExpenseCategory[]}
            isLoading={catLoading}
            emptyMessage="No categories yet."
            searchPlaceholder="Search categories..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateCategory(true)}>
                <Plus className="size-3.5" />
                New Category
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateExpense}
        onOpenChange={setShowCreateExpense}
        title="Create Expense Claim"
        description={`Expense # ${generateNumber("expense", expenses.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createExpMutation.mutate({ ...expForm, amount: Number(expForm.amount) }, {
            onSuccess: () => { setShowCreateExpense(false); toast.success("Expense created"); setExpForm({ categoryId: "", date: todayISO(), amount: "", description: "" }); },
          });
        }}
        isLoading={createExpMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
            <Input type="date" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={expForm.categoryId} onChange={(e) => setExpForm((p) => ({ ...p, categoryId: e.target.value }))} required>
              <option value="">Select category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Amount (PKR)</Label>
          <Input type="number" min="0" step="0.01" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} required placeholder="0.00" className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
          <Textarea value={expForm.description} onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Expense details..." />
        </div>
      </FormDialog>

      <FormDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        title="Add Category"
        onSubmit={(e) => {
          e.preventDefault();
          createCatMutation.mutate(catForm, {
            onSuccess: () => { setShowCreateCategory(false); toast.success("Category added"); setCatForm({ name: "", code: "", description: "" }); },
          });
        }}
        isLoading={createCatMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Code</Label>
            <Input value={catForm.code} onChange={(e) => setCatForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. TRV" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Name</Label>
            <Input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Travel" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
          <Textarea value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
        </div>
      </FormDialog>
    </div>
  );
}
