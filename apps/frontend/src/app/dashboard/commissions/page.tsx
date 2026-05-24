"use client";

import { Percent, Banknote, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface CommissionRule { id: string; name: string; type: string; rate: number; minAmount: string; maxAmount: string; }
interface CommissionEntry { id: string; entityType: string; amount: string; commissionAmount: string; status: string; createdAt: string; }

const ruleColumns: Column<CommissionRule>[] = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "rate", header: "Rate", render: (item) => `${item.rate}%` },
  { key: "minAmount", header: "Min", render: (item) => Number(item.minAmount).toLocaleString() },
  { key: "maxAmount", header: "Max", render: (item) => Number(item.maxAmount).toLocaleString() },
];

const entryColumns: Column<CommissionEntry>[] = [
  { key: "entityType", header: "Entity" },
  { key: "amount", header: "Amount", render: (item) => Number(item.amount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "commissionAmount", header: "Commission", render: (item) => Number(item.commissionAmount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "SETTLED" ? "default" : "secondary"}>{item.status}</Badge> },
  { key: "createdAt", header: "Date", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

export default function CommissionsPage() {
  const { data: rules = [], isLoading: rulesLoading } = useApiList<CommissionRule>(["commission-rules"], "/commissions/rules");
  const { data: entries = [], isLoading: entriesLoading } = useApiList<CommissionEntry>(["commission-entries"], "/commissions/entries");

  return (
    <div className="space-y-6">
      <PageHeader title="Commission & Settlement" description="Commission rules, calculations, and settlements" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Rules" value={rules.length} icon={Percent} />
        <StatCard title="Entries" value={entries.length} icon={Calculator} />
        <StatCard title="Pending" value={entries.filter((e) => e.status === "PENDING").length} icon={Banknote} />
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules"><Percent className="mr-2 size-4" />Rules</TabsTrigger>
          <TabsTrigger value="entries"><Calculator className="mr-2 size-4" />Entries</TabsTrigger>
        </TabsList>
        <TabsContent value="rules" className="space-y-4">
          <DataTable columns={ruleColumns} data={rules as unknown as CommissionRule[]} isLoading={rulesLoading} />
        </TabsContent>
        <TabsContent value="entries" className="space-y-4">
          <DataTable columns={entryColumns} data={entries as unknown as CommissionEntry[]} isLoading={entriesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
