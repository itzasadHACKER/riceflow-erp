import Link from "next/link";
import { Wheat, ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wheat className="size-5" />
            </div>
            <span className="text-xl font-bold">RiceFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <span className="mr-2">🌾</span>
              Enterprise Rice Industry ERP
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              The Complete ERP for{" "}
              <span className="text-primary">Rice Industry</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Manage procurement, production, inventory, sales, finance, and
              logistics — all in one powerful platform built specifically for
              rice mills, traders, and exporters.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Start Free Trial
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" })
                )}
              >
                View Demo Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container mx-auto grid gap-8 px-4 py-20 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wheat className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Rice-Specific Workflows
              </h3>
              <p className="text-sm text-muted-foreground">
                Paddy procurement, moisture calculations, milling processes,
                yield tracking, quality grading — built for the rice industry.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                AI-Powered Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Predictive insights, smart procurement suggestions, and
                automated reporting to drive better business decisions.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Enterprise Security
              </h3>
              <p className="text-sm text-muted-foreground">
                Role-based access control, audit trails, data encryption, and
                multi-branch support for complete organizational security.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="container mx-auto px-4 py-20">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Complete Module Suite
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Organization Management",
                "HR & Payroll",
                "Finance & Accounts",
                "Rice Procurement",
                "Production Management",
                "Inventory & Warehousing",
                "Sales & Distribution",
                "Transport & Logistics",
                "CRM",
                "Reporting & BI",
                "AI Analytics",
                "Multi-Branch Support",
              ].map((module) => (
                <div
                  key={module}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <Zap className="size-4 text-primary" />
                  <span className="text-sm font-medium">{module}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span>© 2024 RiceFlow ERP. All rights reserved.</span>
          <span>Built for the Rice Industry</span>
        </div>
      </footer>
    </div>
  );
}
