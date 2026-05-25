import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down";
  change?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal" | "orange";
}

const colorMap = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/40", icon: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-900/50", gradient: "from-indigo-500/5 to-transparent" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/50", gradient: "from-emerald-500/5 to-transparent" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/50", gradient: "from-amber-500/5 to-transparent" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/40", icon: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-900/50", gradient: "from-rose-500/5 to-transparent" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/40", icon: "text-sky-600 dark:text-sky-400", border: "border-sky-100 dark:border-sky-900/50", gradient: "from-sky-500/5 to-transparent" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/40", icon: "text-violet-600 dark:text-violet-400", border: "border-violet-100 dark:border-violet-900/50", gradient: "from-violet-500/5 to-transparent" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/40", icon: "text-teal-600 dark:text-teal-400", border: "border-teal-100 dark:border-teal-900/50", gradient: "from-teal-500/5 to-transparent" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/40", icon: "text-orange-600 dark:text-orange-400", border: "border-orange-100 dark:border-orange-900/50", gradient: "from-orange-500/5 to-transparent" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  change,
  color,
}: StatCardProps) {
  const c = color ? colorMap[color] : null;

  return (
    <Card className={`relative overflow-hidden ${c ? c.border : ""}`}>
      {c && <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />}
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {change && (
              <p className={`text-xs font-medium ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"}`}>
                {trend === "up" ? "+" : trend === "down" ? "-" : ""}{change}
              </p>
            )}
          </div>
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${c ? c.bg : "bg-primary/10"}`}>
            <Icon className={`size-5 ${c ? c.icon : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
