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
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";

const mainNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const moduleNav = [
  {
    label: "Organization",
    items: [
      { title: "Organization", href: "/dashboard/organization", icon: Building2 },
      { title: "HR & Payroll", href: "/dashboard/hr", icon: Users },
      { title: "Workflow", href: "/dashboard/workflow", icon: GitBranch },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Finance", href: "/dashboard/finance", icon: Wallet },
      { title: "Expense", href: "/dashboard/expense", icon: Receipt },
      { title: "Bank", href: "/dashboard/bank", icon: Landmark },
      { title: "Currencies", href: "/dashboard/currencies", icon: DollarSign },
      { title: "Assets", href: "/dashboard/assets", icon: Building },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Procurement", href: "/dashboard/procurement", icon: Wheat },
      { title: "Production", href: "/dashboard/production", icon: Factory },
      { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
      { title: "Machines", href: "/dashboard/machines", icon: Cog },
      { title: "Quality", href: "/dashboard/quality-control", icon: FlaskConical },
      { title: "BOM", href: "/dashboard/bom", icon: Layers },
      { title: "Gate Pass", href: "/dashboard/gate-pass", icon: DoorOpen },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
      { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe },
      { title: "Salespersons", href: "/dashboard/salespersons", icon: UserCheck },
      { title: "Commissions", href: "/dashboard/commissions", icon: Percent },
      { title: "Transport", href: "/dashboard/transport", icon: Truck },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "CRM", href: "/dashboard/crm", icon: UserSearch },
      { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { title: "Market", href: "/dashboard/market", icon: TrendingUp },
      { title: "Documents", href: "/dashboard/documents", icon: FileText },
      { title: "AI Assistant", href: "/dashboard/ai", icon: Bot },
      { title: "Categories", href: "/dashboard/product-categories", icon: Tag },
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
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {moduleNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
