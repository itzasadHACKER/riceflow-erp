"use client";

import { DollarSign, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface Currency { id: string; code: string; name: string; symbol: string; exchangeRate: number; isBase: boolean; }

const currencyColumns: Column<Currency>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "symbol", header: "Symbol" },
  { key: "exchangeRate", header: "Exchange Rate" },
  { key: "isBase", header: "Base", render: (item) => item.isBase ? <Badge>Base</Badge> : <Badge variant="secondary">Foreign</Badge> },
];

export default function CurrenciesPage() {
  const { data: currencies = [], isLoading } = useApiList<Currency>(["currencies"], "/currencies");

  return (
    <div className="space-y-6">
      <PageHeader title="Multi-Currency" description="Currency management and exchange rates" />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Currencies" value={currencies.length} icon={DollarSign} />
        <StatCard title="Conversion" value="Available" icon={ArrowLeftRight} />
      </div>

      <DataTable columns={currencyColumns} data={currencies as unknown as Currency[]} isLoading={isLoading} emptyMessage="No currencies configured." />
    </div>
  );
}
