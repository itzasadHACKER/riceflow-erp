"use client";

import { Building2, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useApiGet } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  currency: string;
}

export default function OrganizationPage() {
  const org = useAuthStore((s) => s.organization);
  const { data: details } = useApiGet<OrgDetails>(["organization"], "/organizations/current");

  return (
    <div className="space-y-6">
      <PageHeader title="Organization" description="Company profile and configuration" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Company" value={org?.name ?? "—"} icon={Building2} />
        <StatCard title="Slug" value={org?.slug ?? "—"} icon={Globe} />
        <StatCard title="Architecture" value="Multi-Tenant" icon={Shield} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{details?.name ?? org?.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{details?.email ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{details?.phone ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{details?.address ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Website</span><span className="font-medium">{details?.website ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ID</span><span className="font-medium">{details?.taxId ?? "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Multi-Tenant Features</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Data Isolation</span><Badge>Active</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Organization Scope</span><Badge>All Modules</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-medium">{details?.currency ?? "PKR"}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
