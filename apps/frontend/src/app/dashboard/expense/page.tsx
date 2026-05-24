"use client";

import { useState } from "react";
import { Receipt, Folder, TrendingDown } from "lucide-react";
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

interface ExpenseCategory { id: string; name: string; code: string; description: string; }
interface ExpenseEntry { id: string; date: string; category: string; description: string; amount: string; paidTo: string; status: string; }

const categoryColumns: Column<ExpenseCategory>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "description", header: "Description" },
];

const expenseColumns: Column<ExpenseEntry>[] = [
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "category", header: "Category", render: (item) => <Badge variant="outline">{item.category}</Badge> },
  { key: "description", header: "Description" },
  { key: "paidTo", header: "Paid To" },
  { key: "amount", header: "Amount", render: (item) => Number(item.amount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "APPROVED" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function ExpensePage() {
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [showCreateExp, setShowCreateExp] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", code: "", description: "" });
  const [expForm, setExpForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", paidTo: "" });

  const { data: categories = [], isLoading: catLoading } = useApiList<ExpenseCategory>(["expense-categories"], "/expense/categories");
  const { data: expenses = [], isLoading: expLoading } = useApiList<ExpenseEntry>(["expenses"], "/expense/entries");

  const createCatMutation = useApiMutation<ExpenseCategory, typeof catForm>("/expense/categories", "post", [["expense-categories"]]);
  const createExpMutation = useApiMutation<ExpenseEntry, unknown>("/expense/entries", "post", [["expenses"]]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Expense categories, entries, and tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Categories" value={categories.length} icon={Folder} />
        <StatCard title="Expense Entries" value={expenses.length} icon={Receipt} />
        <StatCard title="Total Expenses" value={totalExpenses.toLocaleString("en-PK", { style: "currency", currency: "PKR" })} icon={TrendingDown} />
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries"><Receipt className="mr-2 size-4" />Entries</TabsTrigger>
          <TabsTrigger value="categories"><Folder className="mr-2 size-4" />Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="space-y-4">
          <Button onClick={() => setShowCreateExp(true)}>+ New Expense</Button>
          <DataTable columns={expenseColumns} data={expenses as unknown as ExpenseEntry[]} isLoading={expLoading} />
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Button onClick={() => setShowCreateCat(true)}>+ New Category</Button>
          <DataTable columns={categoryColumns} data={categories as unknown as ExpenseCategory[]} isLoading={catLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateCat} onOpenChange={setShowCreateCat} title="Add Category" onSubmit={(e) => { e.preventDefault(); createCatMutation.mutate(catForm, { onSuccess: () => { setShowCreateCat(false); setCatForm({ name: "", code: "", description: "" }); } }); }} isLoading={createCatMutation.isPending}>
        <div className="space-y-2"><Label>Code</Label><Input value={catForm.code} onChange={(e) => setCatForm((p) => ({ ...p, code: e.target.value }))} required placeholder="EXP-001" /></div>
        <div className="space-y-2"><Label>Name</Label><Input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Description</Label><Input value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} /></div>
      </FormDialog>

      <FormDialog open={showCreateExp} onOpenChange={setShowCreateExp} title="Add Expense" onSubmit={(e) => { e.preventDefault(); createExpMutation.mutate({ ...expForm, amount: Number(expForm.amount) }, { onSuccess: () => { setShowCreateExp(false); setExpForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", paidTo: "" }); } }); }} isLoading={createExpMutation.isPending}>
        <div className="space-y-2"><Label>Date</Label><Input type="date" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Description</Label><Input value={expForm.description} onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Paid To</Label><Input value={expForm.paidTo} onChange={(e) => setExpForm((p) => ({ ...p, paidTo: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Amount (PKR)</Label><Input type="number" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} required placeholder="0" /></div>
      </FormDialog>
    </div>
  );
}
