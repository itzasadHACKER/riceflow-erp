"use client";

import { Building2, Users, MapPin, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useAuthStore } from "@/stores/auth-store";
import { useApiGet } from "@/hooks/use-api";

interface OrgInfo { id: string; name: string; email: string; phone: string; address: string; city: string; country: string; currency: string; logo: string; isActive: boolean; }

export default function OrganizationPage() {
  const org = useAuthStore((s) => s.organization);
  const { data: orgInfo } = useApiGet<OrgInfo>(["org-info"], "/organizations/current");

  const info = orgInfo ?? org;

  return (
    <div className="space-y-6">
      <PageHeader title="Organization" description="Company profile, settings, and branch management" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Company" value={info?.name ?? "—"} icon={Building2} />
        <StatCard title="Currency" value={(info as OrgInfo | null)?.currency ?? "PKR"} icon={Globe} />
        <StatCard title="Location" value={(info as OrgInfo | null)?.city ?? "—"} icon={MapPin} />
        <StatCard title="Status" value="Active" icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Company Name", value: info?.name },
              { label: "Email", value: (info as OrgInfo | null)?.email },
              { label: "Phone", value: (info as OrgInfo | null)?.phone },
              { label: "Address", value: (info as OrgInfo | null)?.address },
              { label: "City", value: (info as OrgInfo | null)?.city },
              { label: "Country", value: (info as OrgInfo | null)?.country },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value ?? "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <Badge className="bg-emerald-600">Enterprise</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Modules</span>
              <span className="font-medium">All (29)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Users</span>
              <span className="font-medium">Unlimited</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <span className="font-medium">Grainix ERP</span> &mdash; Powered by Asad Ali (0308-4420406)
      </div>
    </div>
  );
}
