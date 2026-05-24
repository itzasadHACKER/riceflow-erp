"use client";

import { Bot, MessageSquare, Brain, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

const features = [
  { title: "AI Chat Assistant", icon: MessageSquare, description: "Ask questions about your ERP data, generate reports, and get insights using natural language." },
  { title: "Demand Forecasting", icon: Brain, description: "Predict future demand based on historical sales data and market trends." },
  { title: "Price Prediction", icon: Zap, description: "Get market price predictions for rice commodities using ML models." },
  { title: "Smart Approvals", icon: Bot, description: "AI-powered workflow routing and approval recommendations." },
];

export default function AIPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="AI-powered insights, forecasting, and automation" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="AI Features" value="4" icon={Bot} />
        <StatCard title="Conversations" value="—" icon={MessageSquare} />
        <StatCard title="Models" value="Ready" icon={Brain} />
        <StatCard title="Automations" value="—" icon={Zap} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3">
              <feature.icon className="size-6 text-primary" />
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
