"use client";

import { Landmark, CheckSquare, ArrowUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface Reconciliation { id: string; bankAccountName: string; statementDate: string; statementBalance: string; bookBalance: string; difference: string; status: string; }
interface Cheque { id: string; chequeNumber: string; bankName: string; amount: string; issuedTo: string; date: string; status: string; }

const reconColumns: Column<Reconciliation>[] = [
  { key: "bankAccountName", header: "Bank Account" },
  { key: "statementDate", header: "Statement Date", render: (item) => new Date(item.statementDate).toLocaleDateString() },
  { key: "statementBalance", header: "Statement", render: (item) => Number(item.statementBalance).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "bookBalance", header: "Book Balance", render: (item) => Number(item.bookBalance).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "difference", header: "Difference", render: (item) => Number(item.difference).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "RECONCILED" ? "default" : "secondary"}>{item.status}</Badge> },
];

const chequeColumns: Column<Cheque>[] = [
  { key: "chequeNumber", header: "Cheque #" },
  { key: "bankName", header: "Bank" },
  { key: "amount", header: "Amount", render: (item) => Number(item.amount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "issuedTo", header: "Issued To" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "CLEARED" ? "default" : item.status === "BOUNCED" ? "destructive" : "secondary"}>{item.status}</Badge> },
];

export default function BankPage() {
  const { data: reconciliations = [], isLoading: reconLoading } = useApiList<Reconciliation>(["reconciliations"], "/bank-management/reconciliations");
  const { data: cheques = [], isLoading: chequeLoading } = useApiList<Cheque>(["cheques"], "/bank-management/cheques");

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Management" description="Bank reconciliation, cheque management, and bank book" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Reconciliations" value={reconciliations.length} icon={Landmark} />
        <StatCard title="Cheques" value={cheques.length} icon={CheckSquare} />
        <StatCard title="Pending" value={cheques.filter((c) => c.status === "PENDING").length} icon={ArrowUpDown} />
      </div>

      <Tabs defaultValue="reconciliation">
        <TabsList>
          <TabsTrigger value="reconciliation"><Landmark className="mr-2 size-4" />Reconciliation</TabsTrigger>
          <TabsTrigger value="cheques"><CheckSquare className="mr-2 size-4" />Cheques</TabsTrigger>
        </TabsList>
        <TabsContent value="reconciliation" className="space-y-4">
          <DataTable columns={reconColumns} data={reconciliations as unknown as Reconciliation[]} isLoading={reconLoading} />
        </TabsContent>
        <TabsContent value="cheques" className="space-y-4">
          <DataTable columns={chequeColumns} data={cheques as unknown as Cheque[]} isLoading={chequeLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
