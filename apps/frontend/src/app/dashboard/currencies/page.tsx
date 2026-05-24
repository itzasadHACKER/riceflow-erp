"use client";

import { DollarSign, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface Currency { id: string; code: string; name: string; symbol: string; exchangeRate: number; isBase: boolean; }

const currencyColumns: Column<Currency>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Currency Name" },
  { key: "symbol", header: "Symbol", render: (item) => <span className="font-mono text-lg">{item.symbol}</span> },
  { key: "exchangeRate", header: "Exchange Rate", className: "text-right", render: (item) => <span className="font-mono">{item.exchangeRate?.toFixed(4)}</span> },
  { key: "isBase", header: "Base", render: (item) => item.isBase ? <Badge className="bg-emerald-600">Base</Badge> : <Badge variant="secondary">Foreign</Badge> },
];

export default function CurrenciesPage() {
  const { data: currencies = [], isLoading } = useApiList<Currency>(["currencies"], "/currencies");

  return (
    <div className="space-y-6">
      <PageHeader title="Multi-Currency" description="Currency management, exchange rates, and currency conversion" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Currencies" value={currencies.length} icon={DollarSign} />
        <StatCard title="Base Currency" value={currencies.find((c) => c.isBase)?.code ?? "PKR"} icon={DollarSign} />
        <StatCard title="Foreign" value={currencies.filter((c) => !c.isBase).length} icon={ArrowUpDown} />
      </div>
      <DataTable columns={currencyColumns} data={currencies as unknown as Currency[]} isLoading={isLoading} emptyMessage="No currencies configured." searchPlaceholder="Search currencies..." />
    </div>
  );
}
