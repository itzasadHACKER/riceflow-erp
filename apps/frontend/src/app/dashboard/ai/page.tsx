"use client";

import { Bot, MessageSquare, Zap, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const capabilities = [
  { title: "ERP Assistant", desc: "Ask questions about your data — revenue, inventory levels, pending orders", icon: MessageSquare },
  { title: "Demand Forecasting", desc: "AI-powered prediction of future demand based on historical trends", icon: BarChart3 },
  { title: "Smart Approvals", desc: "Automated approval recommendations based on business rules", icon: Zap },
  { title: "Price Prediction", desc: "Market rate predictions for procurement planning", icon: BarChart3 },
  { title: "OCR Invoice Reader", desc: "Automatically extract data from scanned invoices and receipts", icon: Bot },
  { title: "Sales Forecasting", desc: "Predict future sales volumes and revenue", icon: BarChart3 },
];

export default function AIPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="Smart ERP assistant, predictive analytics, and automation" />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Bot className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Grainix AI</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            AI-powered assistant for your ERP. Ask questions about your business data, get predictions, and automate workflows.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Coming soon — AI integration is in development.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">AI Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <Card key={cap.title} className="group hover:shadow-md hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <cap.icon className="size-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">{cap.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{cap.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
