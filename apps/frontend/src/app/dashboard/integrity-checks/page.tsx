"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileText, TrendingUp, RefreshCw, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface IntegrityCheck {
  check: string;
  status: string;
  details: string;
}

interface TrialBalanceResult {
  isBalanced: boolean;
  totalDebit: string;
  totalCredit: string;
  difference: string;
  accountCount: number;
}

interface DatabaseStats {
  customers: number;
  suppliers: number;
  items: number;
  journalEntries: number;
  invoices: number;
  purchaseOrders: number;
}

export default function IntegrityChecksPage() {
  const [showChecks, setShowChecks] = useState(false);
  const [showTB, setShowTB] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { data: checks = [], isLoading: checksLoading, refetch: runChecks } = useApiList<IntegrityCheck>(
    ["integrity-checks"],
    "/accounting-engine/integrity-checks",
    showChecks,
  );

  const { data: tbRaw = [], isLoading: tbLoading, refetch: runTB } = useApiList<TrialBalanceResult>(
    ["trial-balance-verify"],
    "/accounting-engine/verify-trial-balance",
    showTB,
  );

  const { data: statsRaw = [], isLoading: statsLoading, refetch: runStats } = useApiList<DatabaseStats>(
    ["database-stats"],
    "/accounting-engine/database-stats",
    showStats,
  );

  const passCount = checks.filter((c) => c.status === "PASS").length;
  const failCount = checks.filter((c) => c.status === "FAIL").length;
  const warnCount = checks.filter((c) => c.status === "WARNING").length;

  const tb: TrialBalanceResult | null = tbRaw.length > 0 ? tbRaw[0] : null;
  const stats: DatabaseStats | null = statsRaw.length > 0 ? statsRaw[0] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Integrity & Reports"
        description="Run data integrity checks, verify trial balance, generate financial reports, and view database statistics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Checks Run" value={checks.length} icon={ShieldCheck} />
        <StatCard title="Passed" value={passCount} icon={CheckCircle} description="All clear" />
        <StatCard title="Failed" value={failCount} icon={XCircle} description={failCount > 0 ? "Needs attention" : "None"} />
        <StatCard title="Warnings" value={warnCount} icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Integrity Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Data Integrity Checks
            </CardTitle>
            <CardDescription>Validate JE balancing, orphaned records, duplicates, and trial balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => { setShowChecks(true); runChecks(); }}
              disabled={checksLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checksLoading ? "animate-spin" : ""}`} />
              {checksLoading ? "Running..." : "Run All Checks"}
            </Button>

            {checks.length > 0 && (
              <div className="space-y-3">
                {checks.map((check, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    {check.status === "PASS" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : check.status === "FAIL" ? (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{check.check}</span>
                        <Badge
                          variant={check.status === "PASS" ? "outline" : "destructive"}
                          className={check.status === "PASS" ? "bg-green-50 text-green-700 border-green-200" : ""}
                        >
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{check.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trial Balance Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trial Balance Verification
            </CardTitle>
            <CardDescription>Verify that total debits equal total credits across all posted journal entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => { setShowTB(true); runTB(); }}
              disabled={tbLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${tbLoading ? "animate-spin" : ""}`} />
              {tbLoading ? "Verifying..." : "Verify Trial Balance"}
            </Button>

            {tb && (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${tb.isBalanced ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {tb.isBalanced ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${tb.isBalanced ? "text-green-800" : "text-red-800"}`}>
                      {tb.isBalanced ? "Trial Balance is BALANCED" : "Trial Balance is UNBALANCED"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Debit:</span>
                      <span className="ml-2 font-mono font-medium">{Number(tb.totalDebit).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Credit:</span>
                      <span className="ml-2 font-mono font-medium">{Number(tb.totalCredit).toLocaleString()}</span>
                    </div>
                    {!tb.isBalanced && (
                      <div className="col-span-2 text-red-600 font-medium">
                        Difference: {Number(tb.difference).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Financial Reports (PDF)
            </CardTitle>
            <CardDescription>Generate and download professional PDF reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <a href="/api/v1/reports/pdf/trial-balance" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="justify-start w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Trial Balance Report
                </Button>
              </a>
              <a href="/api/v1/reports/pdf/profit-loss" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="justify-start w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Profit & Loss Statement
                </Button>
              </a>
              <a href="/api/v1/reports/pdf/balance-sheet" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="justify-start w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Balance Sheet
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Statistics
            </CardTitle>
            <CardDescription>Count of records across all major entities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => { setShowStats(true); runStats(); }}
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
              {statsLoading ? "Loading..." : "Load Statistics"}
            </Button>

            {stats && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : String(value)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
