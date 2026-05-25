"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  finance: "Finance",
  hr: "HR & Payroll",
  sales: "Sales",
  procurement: "Procurement",
  inventory: "Inventory",
  production: "Production",
  crm: "CRM",
  transport: "Transport",
  reports: "Reports",
  settings: "Settings",
  organization: "Organization",
  assets: "Assets",
  "quality-control": "Quality Control",
  expense: "Expense",
  "export-sales": "Export Sales",
  workflow: "Workflow",
  machines: "Machines",
  documents: "Documents",
  currencies: "Currencies",
  commissions: "Commissions",
  market: "Market",
  bank: "Bank",
  ai: "AI Assistant",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home className="size-3.5" />
      </Link>
      {segments.slice(1).map((segment, i) => (
        <span key={segment} className="flex items-center gap-1">
          <ChevronRight className="size-3" />
          {i === segments.length - 2 ? (
            <span className="font-medium text-foreground">{labels[segment] ?? segment}</span>
          ) : (
            <Link href={`/${segments.slice(0, i + 2).join("/")}`} className="hover:text-foreground transition-colors">
              {labels[segment] ?? segment}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
