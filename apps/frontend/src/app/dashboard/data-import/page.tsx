"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Users, Building, Package, DollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useApiMutation } from "@/hooks/use-api";
import { toast } from "sonner";

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

function ImportCard({
  title,
  description,
  icon: Icon,
  fields,
  endpoint,
  dataKey,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  fields: string[];
  endpoint: string;
  dataKey: string;
}) {
  const [jsonData, setJsonData] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useApiMutation<ImportResult, Record<string, unknown[]>>(endpoint, "post", {
    onSuccess: () => {
      toast.success("Import completed successfully");
    },
  });

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonData) as unknown[];
      const payload: Record<string, unknown[]> = { [dataKey]: Array.isArray(parsed) ? parsed : [parsed] };
      importMutation.mutate(payload);
    } catch {
      toast.error("Invalid JSON. Please check the format.");
    }
  };

  const sampleData = fields.reduce((acc, f) => ({ ...acc, [f]: `sample_${f}` }), {});

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
        <div>
          <Label>Required Fields</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {fields.map((f) => (
              <Badge key={f} variant="outline" className="font-mono text-xs">
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Sample Format</Label>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto mt-1">
            {JSON.stringify([sampleData], null, 2)}
          </pre>
        </div>

        <div>
          <Label>Paste JSON Data</Label>
          <textarea
            className="w-full h-32 p-3 border rounded-md font-mono text-xs resize-y mt-1 bg-background"
            placeholder={`Paste JSON array of ${title.toLowerCase()}...`}
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleImport} disabled={!jsonData.trim() || importMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>

          {result && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{result.imported} imported</span>
              {result.skipped > 0 && (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">{result.skipped} skipped</span>
                </>
              )}
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
      <PageHeader title="Data Import" description="Import master data from external sources — customers, suppliers, items, and opening balances" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Customers" value="Import" icon={Users} description="JSON format" />
        <StatCard title="Suppliers" value="Import" icon={Building} description="JSON format" />
        <StatCard title="Items" value="Import" icon={Package} description="JSON format" />
        <StatCard title="Opening Balances" value="Import" icon={DollarSign} description="Must balance Dr=Cr" />
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="balances">Opening Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <ImportCard
            title="Customers"
            description="Import customer master data. Duplicates (by name) will be skipped."
            icon={Users}
            fields={["name", "phone", "address", "email", "creditLimit"]}
            endpoint="/accounting-engine/import/customers"
            dataKey="customers"
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <ImportCard
            title="Suppliers"
            description="Import supplier master data. Duplicates (by name) will be skipped."
            icon={Building}
            fields={["name", "phone", "address", "email", "creditLimit"]}
            endpoint="/accounting-engine/import/suppliers"
            dataKey="suppliers"
          />
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <ImportCard
            title="Inventory Items"
            description="Import inventory items. Requires warehouse and rice variety IDs."
            icon={Package}
            fields={["lotNumber", "warehouseId", "riceVarietyId", "quantity", "unit", "valuationRate"]}
            endpoint="/accounting-engine/import/items"
            dataKey="items"
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <ImportCard
            title="Opening Balances"
            description="Import opening balances by account code. Total debits MUST equal total credits."
            icon={DollarSign}
            fields={["accountCode", "debit", "credit"]}
            endpoint="/accounting-engine/opening-balances"
            dataKey="balances"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
