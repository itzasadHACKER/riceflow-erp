"use client";

import { Settings, Bell, Shield, Upload, FileText, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const settingSections = [
  { title: "System Settings", desc: "Currency, numbering, tax rates, default values", icon: Settings },
  { title: "Notifications", desc: "Email, SMS, WhatsApp, and push notification preferences", icon: Bell },
  { title: "Audit Logs", desc: "Track all changes and user activities", icon: Shield },
  { title: "Branding", desc: "Company logo, letterhead, and theme customization", icon: Upload },
  { title: "Print Templates", desc: "Invoice, receipt, and report print formats", icon: FileText },
  { title: "Integrations", desc: "Gmail, WhatsApp, payment gateways, and API configuration", icon: Globe },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Configuration" description="System settings, notifications, audit logs, and customization" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingSections.map((section) => (
          <Card key={section.title} className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <section.icon className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{section.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <span className="font-medium">Grainix ERP</span> &mdash; Powered by Asad Ali (0308-4420406) &mdash; All rights reserved.
      </div>
    </div>
  );
}
