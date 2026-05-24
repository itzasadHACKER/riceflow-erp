"use client";

import { useState } from "react";
import { Upload, Users, Building, Package, DollarSign, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useApiMutation } from "@/hooks/use-api";
import { toast } from "sonner";

const sampleCsvData: Record<string, string> = {
  customers: `name,phone,email,address,opening_balance
Ahmad Rice Traders,0300-1234567,ahmad@email.com,"Katchery Road, Lahore",50000
Khalid Exports,0321-7654321,khalid@email.com,"GT Road, Gujranwala",0`,
  suppliers: `name,phone,email,address,opening_balance
Farmer Ali,0345-1112233,,Village Nawan Pind,25000
Paddy Suppliers Co,0312-9998877,info@paddyco.com,"Mandi Bahauddin",100000`,
  items: `lot_number,warehouse_id,rice_variety_id,quantity,unit,valuation_rate
LOT-2025-001,warehouse-uuid,variety-uuid,5000,KG,85.50
LOT-2025-002,warehouse-uuid,variety-uuid,3000,KG,92.00`,
  balances: `account_code,debit,credit
1001,500000,0
1002,200000,0
2001,0,400000
3001,0,300000`,
};

function ImportCard({
  title,
  description,
  icon: Icon,
  fields,
  jsonEndpoint,
  csvEndpoint,
  dataKey,
  sampleCsv,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  fields: string[];
  jsonEndpoint: string;
  csvEndpoint: string;
  dataKey: string;
  sampleCsv: string;
}) {
  const [mode, setMode] = useState<"csv" | "json">("csv");
  const [data, setData] = useState("");
  const [importDone, setImportDone] = useState(false);

  const jsonMutation = useApiMutation<unknown, Record<string, unknown[]>>(jsonEndpoint, "post", {
    onSuccess: () => {
      toast.success("JSON import completed");
      setImportDone(true);
    },
  });

  const csvMutation = useApiMutation<unknown, { csv: string }>(csvEndpoint, "post", {
    onSuccess: () => {
      toast.success("CSV import completed");
      setImportDone(true);
    },
  });

  const handleImport = () => {
    if (!data.trim()) {
      toast.error("Please enter data first");
      return;
    }
    if (mode === "csv") {
      csvMutation.mutate({ csv: data });
    } else {
      try {
        const parsed = JSON.parse(data) as unknown[];
        jsonMutation.mutate({ [dataKey]: Array.isArray(parsed) ? parsed : [parsed] });
      } catch {
        toast.error("Invalid JSON format");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setData(text);
      setMode("csv");
      toast.success(`File loaded: ${file.name} (${text.split("\n").length - 1} rows)`);
    };
    reader.readAsText(file);
  };

  const isPending = jsonMutation.isPending || csvMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "csv" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("csv")}
          >
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            variant={mode === "json" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("json")}
          >
            JSON
          </Button>
        </div>

        {/* Required fields */}
        <div>
          <Label>Columns / Fields</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {fields.map((f) => (
              <Badge key={f} variant="outline" className="font-mono text-xs">{f}</Badge>
            ))}
          </div>
        </div>

        {/* Sample data */}
        {mode === "csv" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Sample CSV</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(sampleCsv);
                  toast.success("Copied sample CSV");
                }}
              >
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">{sampleCsv}</pre>
          </div>
        )}

        {mode === "json" && (
          <div>
            <Label>Sample JSON</Label>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono mt-1">
              {JSON.stringify([fields.reduce((acc, f) => ({ ...acc, [f]: `sample_${f}` }), {})], null, 2)}
            </pre>
          </div>
        )}

        {/* File upload (CSV only) */}
        {mode === "csv" && (
          <div>
            <Label>Upload CSV File</Label>
            <label className="flex items-center gap-2 px-4 py-2 mt-1 bg-muted border border-dashed rounded-lg cursor-pointer hover:bg-muted/80 transition-colors w-fit">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Choose .csv file</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* Data input */}
        <div>
          <Label>Paste {mode.toUpperCase()} Data</Label>
          <textarea
            className="w-full h-32 p-3 border rounded-md font-mono text-xs resize-y mt-1 bg-background"
            placeholder={`Paste ${mode.toUpperCase()} data for ${title.toLowerCase()}...`}
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        {/* Import button */}
        <div className="flex items-center gap-3">
          <Button onClick={handleImport} disabled={!data.trim() || isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {isPending ? "Importing..." : `Import ${mode.toUpperCase()}`}
          </Button>

          {importDone && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Import completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Data Import" description="Import master data via CSV or JSON — customers, suppliers, items, and opening balances" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Customers" value="Import" icon={Users} description="CSV or JSON" />
        <StatCard title="Suppliers" value="Import" icon={Building} description="CSV or JSON" />
        <StatCard title="Items" value="Import" icon={Package} description="CSV or JSON" />
        <StatCard title="Opening Balances" value="Import" icon={DollarSign} description="Must balance Dr=Cr" />
        <a href="/dashboard/new-season" className="block">
          <Card className="h-full border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-2">
              <ArrowRight className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">New Season Wizard</span>
              <span className="text-xs text-muted-foreground">Step-by-step setup</span>
            </CardContent>
          </Card>
        </a>
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="balances">Opening Balances</TabsTrigger>
          <TabsTrigger value="party">Party Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <ImportCard
            title="Customers"
            description="Import customer master data. Duplicates (by name) will be skipped."
            icon={Users}
            fields={["name", "phone", "email", "address", "opening_balance"]}
            jsonEndpoint="/accounting-engine/import/customers"
            csvEndpoint="/csv-import/customers"
            dataKey="customers"
            sampleCsv={sampleCsvData.customers}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <ImportCard
            title="Suppliers"
            description="Import supplier master data. Duplicates (by name) will be skipped."
            icon={Building}
            fields={["name", "phone", "email", "address", "opening_balance"]}
            jsonEndpoint="/accounting-engine/import/suppliers"
            csvEndpoint="/csv-import/suppliers"
            dataKey="suppliers"
            sampleCsv={sampleCsvData.suppliers}
          />
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <ImportCard
            title="Inventory Items"
            description="Import inventory items. Requires warehouse and rice variety IDs."
            icon={Package}
            fields={["lot_number", "warehouse_id", "rice_variety_id", "quantity", "unit", "valuation_rate"]}
            jsonEndpoint="/accounting-engine/import/items"
            csvEndpoint="/csv-import/items"
            dataKey="items"
            sampleCsv={sampleCsvData.items}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <ImportCard
            title="Opening Balances"
            description="Import opening balances by account code. Total debits MUST equal total credits."
            icon={DollarSign}
            fields={["account_code", "debit", "credit"]}
            jsonEndpoint="/accounting-engine/opening-balances"
            csvEndpoint="/csv-import/opening-balances"
            dataKey="balances"
            sampleCsv={sampleCsvData.balances}
          />
        </TabsContent>

        <TabsContent value="party" className="mt-4">
          <ImportCard
            title="Party-wise Balances"
            description="Set opening balances for individual customers/suppliers. Import customers and suppliers first."
            icon={FileSpreadsheet}
            fields={["name", "balance", "type"]}
            jsonEndpoint="/csv-import/party-balances"
            csvEndpoint="/csv-import/party-balances"
            dataKey="partyBalances"
            sampleCsv={sampleCsvData.balances}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
