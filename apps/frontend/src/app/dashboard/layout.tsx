import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
          <span className="font-medium">Grainix ERP</span> &mdash; &copy; 2026 All rights reserved. Powered by Asad Ali (0308-4420406)
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
