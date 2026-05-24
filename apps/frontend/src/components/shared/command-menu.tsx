"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Wheat,
  Factory,
  Warehouse,
  ShoppingCart,
  Truck,
  UserSearch,
  BarChart3,
  Settings,
  Building,
  FlaskConical,
  Receipt,
  Globe,
  GitBranch,
  Cog,
  FileText,
  DollarSign,
  Percent,
  TrendingUp,
  Landmark,
  Bot,
  Building2,
  Plus,
  DoorOpen,
  Layers,
  UserCheck,
  Tag,
  Megaphone,
  Mail,
  PiggyBank,
  Phone,
  FolderKanban,
  PackageSearch,
  CreditCard,
  Target,
  Shield,
  Calendar,
  Hash,
  Handshake,
  ArrowDownCircle,
  Repeat,
  Link2,
  Download,
  Printer,
  Route,
  ArrowLeftRight,
  FileCheck,
  Scale,
} from "lucide-react";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pages = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Finance & Accounts", href: "/dashboard/finance", icon: Wallet },
  { title: "HR & Payroll", href: "/dashboard/hr", icon: Users },
  { title: "Procurement", href: "/dashboard/procurement", icon: Wheat },
  { title: "Production", href: "/dashboard/production", icon: Factory },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { title: "Sales & Distribution", href: "/dashboard/sales", icon: ShoppingCart },
  { title: "CRM", href: "/dashboard/crm", icon: UserSearch },
  { title: "Transport", href: "/dashboard/transport", icon: Truck },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Organization", href: "/dashboard/organization", icon: Building2 },
  { title: "Assets", href: "/dashboard/assets", icon: Building },
  { title: "Quality Control", href: "/dashboard/quality-control", icon: FlaskConical },
  { title: "Expense", href: "/dashboard/expense", icon: Receipt },
  { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe },
  { title: "Workflow", href: "/dashboard/workflow", icon: GitBranch },
  { title: "Machines", href: "/dashboard/machines", icon: Cog },
  { title: "Documents", href: "/dashboard/documents", icon: FileText },
  { title: "Currencies", href: "/dashboard/currencies", icon: DollarSign },
  { title: "Commissions", href: "/dashboard/commissions", icon: Percent },
  { title: "Market Intelligence", href: "/dashboard/market", icon: TrendingUp },
  { title: "Bank Management", href: "/dashboard/bank", icon: Landmark },
  { title: "AI Assistant", href: "/dashboard/ai", icon: Bot },
  { title: "Gate Pass", href: "/dashboard/gate-pass", icon: DoorOpen },
  { title: "Bill of Materials", href: "/dashboard/bom", icon: Layers },
  { title: "Salespersons", href: "/dashboard/salespersons", icon: UserCheck },
  { title: "Product Categories", href: "/dashboard/product-categories", icon: Tag },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { title: "Email & Communication", href: "/dashboard/email", icon: Mail },
  { title: "Budgeting", href: "/dashboard/budgeting", icon: PiggyBank },
  { title: "Service Management", href: "/dashboard/service-management", icon: Phone },
  { title: "Project Management", href: "/dashboard/project-management", icon: FolderKanban },
  { title: "MRP Engine", href: "/dashboard/mrp", icon: Cog },
  { title: "Sales Quotations", href: "/dashboard/sales-quotations", icon: FileText },
  { title: "Pricing & Discounts", href: "/dashboard/pricing", icon: Tag },
  { title: "Requisitions & RFQ", href: "/dashboard/purchase-enhancements", icon: Handshake },
  { title: "Batch & Serial Tracking", href: "/dashboard/batch-serial", icon: Hash },
  { title: "Pick & Pack", href: "/dashboard/pick-pack", icon: PackageSearch },
  { title: "Cost Centers", href: "/dashboard/cost-centers", icon: Building2 },
  { title: "Payment Wizard & Dunning", href: "/dashboard/payment-wizard", icon: CreditCard },
  { title: "Marketing Campaigns", href: "/dashboard/marketing-campaigns", icon: Target },
  { title: "Financial Periods", href: "/dashboard/financial-periods", icon: Calendar },
  { title: "Production Orders", href: "/dashboard/production-orders", icon: Factory },
  { title: "Admin Enhancements", href: "/dashboard/admin-enhancements", icon: Shield },
  { title: "Credit Notes & Returns", href: "/dashboard/credit-notes", icon: ArrowDownCircle },
  { title: "Deposits & Payments", href: "/dashboard/deposits-payments", icon: CreditCard },
  { title: "Admin Tools (UDF/Print)", href: "/dashboard/admin-tools", icon: Printer },
  { title: "Resource Capacity & Routing", href: "/dashboard/production-enhanced", icon: Route },
  { title: "Transfers & Counting", href: "/dashboard/inventory-enhanced", icon: ArrowLeftRight },
  { title: "Recurring JEs & Bank Import", href: "/dashboard/finance-enhanced", icon: Repeat },
  { title: "3-Way Matching & Landed Costs", href: "/dashboard/purchase-enhanced", icon: FileCheck },
];

const actions = [
  { title: "New Invoice", href: "/dashboard/sales?tab=invoices&new=1", icon: Plus },
  { title: "New Sales Order", href: "/dashboard/sales?tab=orders&new=1", icon: Plus },
  { title: "New Journal Entry", href: "/dashboard/finance?tab=journals&new=1", icon: Plus },
  { title: "New Customer", href: "/dashboard/sales?tab=customers&new=1", icon: Plus },
  { title: "New Employee", href: "/dashboard/hr?new=1", icon: Plus },
  { title: "New Supplier", href: "/dashboard/procurement?tab=suppliers&new=1", icon: Plus },
  { title: "New Expense", href: "/dashboard/expense?new=1", icon: Plus },
  { title: "New Purchase", href: "/dashboard/procurement?tab=purchases&new=1", icon: Plus },
  { title: "New Gate Pass", href: "/dashboard/gate-pass", icon: Plus },
  { title: "New Salesperson", href: "/dashboard/salespersons", icon: Plus },
  { title: "New BOM", href: "/dashboard/bom", icon: Plus },
  { title: "New Announcement", href: "/dashboard/announcements", icon: Plus },
  { title: "New Budget", href: "/dashboard/budgeting", icon: Plus },
  { title: "Compose Email", href: "/dashboard/email", icon: Plus },
  { title: "New Service Call", href: "/dashboard/service-management", icon: Plus },
  { title: "New Project", href: "/dashboard/project-management", icon: Plus },
  { title: "New Quotation", href: "/dashboard/sales-quotations", icon: Plus },
  { title: "Run MRP", href: "/dashboard/mrp", icon: Plus },
  { title: "New Campaign", href: "/dashboard/marketing-campaigns", icon: Plus },
  { title: "New Production Order", href: "/dashboard/production-orders", icon: Plus },
  { title: "New Credit Note", href: "/dashboard/credit-notes", icon: Plus },
  { title: "New Debit Note", href: "/dashboard/credit-notes", icon: Plus },
  { title: "Record Deposit", href: "/dashboard/deposits-payments", icon: Plus },
  { title: "Record Payment", href: "/dashboard/deposits-payments", icon: Plus },
  { title: "Add Custom Field", href: "/dashboard/admin-tools", icon: Plus },
];

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  const onSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search modules, create entries, navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {actions.map((item) => (
            <CommandItem key={item.href} onSelect={() => onSelect(item.href)}>
              <item.icon className="mr-2 size-4 text-primary" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {pages.map((item) => (
            <CommandItem key={item.href} onSelect={() => onSelect(item.href)}>
              <item.icon className="mr-2 size-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
