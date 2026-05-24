"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  Wallet,
  Wheat,
  Factory,
  Warehouse,
  ShoppingCart,
  Truck,
  UserSearch,
  BarChart3,
  Bot,
  Settings,
  ChevronDown,
  ChevronRight,
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
  LogOut,
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
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

interface NavSection {
  label: string;
  groups: NavGroup[];
}

const moduleNav: NavSection[] = [
  {
    label: "Organization",
    groups: [
      {
        title: "Company",
        icon: Building2,
        items: [
          { title: "Organization", href: "/dashboard/organization", icon: Building2 },
          { title: "HR & Payroll", href: "/dashboard/hr", icon: Users },
          { title: "Workflow", href: "/dashboard/workflow", icon: GitBranch },
          { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
          { title: "Email", href: "/dashboard/email", icon: Mail },
        ],
      },
    ],
  },
  {
    label: "Finance",
    groups: [
      {
        title: "Accounting",
        icon: Wallet,
        items: [
          { title: "Chart of Accounts", href: "/dashboard/finance", icon: Wallet },
          { title: "Expense & Vouchers", href: "/dashboard/expense", icon: Receipt },
          { title: "Bank & Cheques", href: "/dashboard/bank", icon: Landmark },
          { title: "Currencies", href: "/dashboard/currencies", icon: DollarSign },
          { title: "Assets", href: "/dashboard/assets", icon: Building },
          { title: "Budgeting", href: "/dashboard/budgeting", icon: PiggyBank },
        ],
      },
      {
        title: "Financial Enhancements",
        icon: Calendar,
        items: [
          { title: "Cost Centers", href: "/dashboard/cost-centers", icon: Building2 },
          { title: "Financial Periods", href: "/dashboard/financial-periods", icon: Calendar },
          { title: "Payment Wizard", href: "/dashboard/payment-wizard", icon: CreditCard },
        ],
      },
    ],
  },
  {
    label: "Sales & CRM",
    groups: [
      {
        title: "Sales",
        icon: ShoppingCart,
        items: [
          { title: "Sales Orders", href: "/dashboard/sales", icon: ShoppingCart },
          { title: "Sales Quotations", href: "/dashboard/sales-quotations", icon: FileText },
          { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe },
          { title: "Pricing", href: "/dashboard/pricing", icon: Tag },
          { title: "Commissions", href: "/dashboard/commissions", icon: Percent },
          { title: "Salespersons", href: "/dashboard/salespersons", icon: UserCheck },
        ],
      },
      {
        title: "CRM & Marketing",
        icon: UserSearch,
        items: [
          { title: "CRM", href: "/dashboard/crm", icon: UserSearch },
          { title: "Marketing Campaigns", href: "/dashboard/marketing-campaigns", icon: Target },
        ],
      },
    ],
  },
  {
    label: "Purchasing",
    groups: [
      {
        title: "Procurement",
        icon: Wheat,
        items: [
          { title: "Purchase Orders", href: "/dashboard/procurement", icon: Wheat },
          { title: "Requisitions & RFQ", href: "/dashboard/purchase-enhancements", icon: Handshake },
        ],
      },
    ],
  },
  {
    label: "Inventory & Logistics",
    groups: [
      {
        title: "Inventory",
        icon: Warehouse,
        items: [
          { title: "Stock & Warehouses", href: "/dashboard/inventory", icon: Warehouse },
          { title: "Batch & Serial", href: "/dashboard/batch-serial", icon: Hash },
          { title: "Pick & Pack", href: "/dashboard/pick-pack", icon: PackageSearch },
          { title: "Categories", href: "/dashboard/product-categories", icon: Tag },
        ],
      },
      {
        title: "Logistics",
        icon: Truck,
        items: [
          { title: "Transport", href: "/dashboard/transport", icon: Truck },
          { title: "Gate Pass", href: "/dashboard/gate-pass", icon: DoorOpen },
        ],
      },
    ],
  },
  {
    label: "Production",
    groups: [
      {
        title: "Manufacturing",
        icon: Factory,
        items: [
          { title: "Production Batches", href: "/dashboard/production", icon: Factory },
          { title: "Production Orders", href: "/dashboard/production-orders", icon: Factory },
          { title: "BOM", href: "/dashboard/bom", icon: Layers },
          { title: "MRP Engine", href: "/dashboard/mrp", icon: Cog },
          { title: "Machines", href: "/dashboard/machines", icon: Cog },
          { title: "Quality Control", href: "/dashboard/quality-control", icon: FlaskConical },
        ],
      },
    ],
  },
  {
    label: "Services & Projects",
    groups: [
      {
        title: "Service Management",
        icon: Phone,
        items: [
          { title: "Service Calls", href: "/dashboard/service-management", icon: Phone },
          { title: "Projects", href: "/dashboard/project-management", icon: FolderKanban },
        ],
      },
    ],
  },
  {
    label: "Intelligence",
    groups: [
      {
        title: "Reports & BI",
        icon: BarChart3,
        items: [
          { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
          { title: "Market Intel", href: "/dashboard/market", icon: TrendingUp },
          { title: "Documents", href: "/dashboard/documents", icon: FileText },
          { title: "AI Assistant", href: "/dashboard/ai", icon: Bot },
        ],
      },
    ],
  },
  {
    label: "Administration",
    groups: [
      {
        title: "Admin Tools",
        icon: Shield,
        items: [
          { title: "Settings", href: "/dashboard/settings", icon: Settings },
          { title: "Custom Tables & Auth", href: "/dashboard/admin-enhancements", icon: Shield },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "GX";

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wheat className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Grainix</span>
                <span className="text-xs text-muted-foreground">
                  Enterprise ERP
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" />}
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {moduleNav.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.groups.map((group) => {
                  const isGroupActive = group.items.some((item) =>
                    pathname.startsWith(item.href)
                  );
                  return (
                    <Collapsible
                      key={group.title}
                      defaultOpen={isGroupActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton tooltip={group.title} />
                          }
                        >
                          <group.icon className="size-4" />
                          <span>{group.title}</span>
                          <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.items.map((item) => (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={item.href} />}
                                  isActive={pathname.startsWith(item.href)}
                                >
                                  <span>{item.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[popup-open]:bg-sidebar-accent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
              >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium text-sm">
                      {user ? `${user.firstName} ${user.lastName}` : "Admin User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email ?? "admin@grainix.com"}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="start"
              >
                <DropdownMenuItem>
                  <Link href="/dashboard/settings" className="flex items-center w-full">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
