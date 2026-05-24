"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils/numbering";

interface MarketRate { id: string; commodity: string; market: string; rate: number; date: string; unit: string; }

const rateColumns: Column<MarketRate>[] = [
  { key: "commodity", header: "Commodity" },
  { key: "market", header: "Market", render: (item) => <Badge variant="outline">{item.market}</Badge> },
  { key: "rate", header: "Rate", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.rate)}</span> },
  { key: "unit", header: "Unit" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
];

export default function MarketPage() {
  const { data: rates = [], isLoading } = useApiList<MarketRate>(["market-rates"], "/market/rates");

  return (
    <div className="space-y-6">
      <PageHeader title="Market Intelligence" description="Market rates, commodity trends, and seasonal analytics" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Market Rates" value={rates.length} icon={TrendingUp} />
        <StatCard title="Commodities" value={new Set(rates.map((r) => r.commodity)).size} icon={BarChart3} />
        <StatCard title="Markets" value={new Set(rates.map((r) => r.market)).size} icon={TrendingUp} />
      </div>
      <DataTable columns={rateColumns} data={rates as unknown as MarketRate[]} isLoading={isLoading} emptyMessage="No market rates available." searchPlaceholder="Search rates..." />
    </div>
  );
}
