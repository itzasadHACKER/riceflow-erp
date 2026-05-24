"use client";

import { Percent, Calculator, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils/numbering";

interface CommRule { id: string; name: string; type: string; rate: number; minAmount: number; maxAmount: number; isActive: boolean; }
interface CommEntry { id: string; agentName: string; amount: string; transactionAmount: string; date: string; status: string; }
interface Settlement { id: string; agentName: string; totalAmount: string; date: string; status: string; }

const ruleColumns: Column<CommRule>[] = [
  { key: "name", header: "Rule Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "rate", header: "Rate", className: "text-right", render: (item) => <span className="font-mono">{item.rate}%</span> },
  { key: "minAmount", header: "Min Txn", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.minAmount)}</span> },
  { key: "maxAmount", header: "Max Txn", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.maxAmount)}</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const entryColumns: Column<CommEntry>[] = [
  { key: "agentName", header: "Agent" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "transactionAmount", header: "Txn Amount", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.transactionAmount)}</span> },
  { key: "amount", header: "Commission", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "SETTLED" ? "default" : "secondary"} className={item.status === "SETTLED" ? "bg-emerald-600" : ""}>{item.status}</Badge> },
];

const settlementColumns: Column<Settlement>[] = [
  { key: "agentName", header: "Agent" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"} className={item.status === "COMPLETED" ? "bg-emerald-600" : ""}>{item.status}</Badge> },
];

export default function CommissionsPage() {
  const { data: rules = [], isLoading: rLoading } = useApiList<CommRule>(["commission-rules"], "/commissions/rules");
  const { data: entries = [], isLoading: eLoading } = useApiList<CommEntry>(["commission-entries"], "/commissions/entries");
  const { data: settlements = [], isLoading: sLoading } = useApiList<Settlement>(["settlements"], "/commissions/settlements");

  const totalCommission = entries.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Commissions & Settlement" description="Commission rules, calculations, and agent settlements" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Rules" value={rules.length} icon={Percent} />
        <StatCard title="Entries" value={entries.length} icon={Calculator} />
        <StatCard title="Total Commission" value={formatCurrency(totalCommission)} icon={Percent} />
        <StatCard title="Settlements" value={settlements.length} icon={CheckSquare} />
      </div>
      <Tabs defaultValue="entries">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="entries" className="gap-1.5"><Calculator className="size-3.5" />Entries</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><Percent className="size-3.5" />Rules</TabsTrigger>
          <TabsTrigger value="settlements" className="gap-1.5"><CheckSquare className="size-3.5" />Settlements</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="space-y-4 mt-4">
          <DataTable columns={entryColumns} data={entries as unknown as CommEntry[]} isLoading={eLoading} emptyMessage="No commission entries." searchPlaceholder="Search entries..." />
        </TabsContent>
        <TabsContent value="rules" className="space-y-4 mt-4">
          <DataTable columns={ruleColumns} data={rules as unknown as CommRule[]} isLoading={rLoading} emptyMessage="No commission rules." searchPlaceholder="Search rules..." />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4 mt-4">
          <DataTable columns={settlementColumns} data={settlements as unknown as Settlement[]} isLoading={sLoading} emptyMessage="No settlements." searchPlaceholder="Search settlements..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
