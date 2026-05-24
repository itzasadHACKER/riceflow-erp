"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface MarketRate { id: string; commodity: string; market: string; rate: number; unit: string; date: string; trend: string; }

const rateColumns: Column<MarketRate>[] = [
  { key: "commodity", header: "Commodity" },
  { key: "market", header: "Market" },
  { key: "rate", header: "Rate", render: (item) => Number(item.rate).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "unit", header: "Unit" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "trend", header: "Trend", render: (item) => <Badge variant={item.trend === "UP" ? "default" : item.trend === "DOWN" ? "destructive" : "secondary"}>{item.trend}</Badge> },
];

export default function MarketPage() {
  const { data: rates = [], isLoading } = useApiList<MarketRate>(["market-rates"], "/market/rates");

  return (
    <div className="space-y-6">
      <PageHeader title="Market Intelligence" description="Commodity rates, price trends, and market analysis" />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Market Rates" value={rates.length} icon={TrendingUp} />
        <StatCard title="Analytics" value="Available" icon={BarChart3} />
      </div>

      <DataTable columns={rateColumns} data={rates as unknown as MarketRate[]} isLoading={isLoading} emptyMessage="No market rates recorded." />
    </div>
  );
}
