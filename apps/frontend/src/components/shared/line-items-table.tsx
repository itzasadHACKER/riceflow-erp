"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

function emptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    rate: 0,
    amount: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 0,
  };
}

function recalc(line: LineItem): LineItem {
  const amount = line.quantity * line.rate;
  const taxAmount = (amount * line.taxPercent) / 100;
  return { ...line, amount, taxAmount, total: amount + taxAmount };
}

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
  readOnly?: boolean;
}

export function LineItemsTable({
  items,
  onChange,
  currency = "PKR",
  readOnly = false,
}: LineItemsTableProps) {
  const fmt = (n: number) =>
    n.toLocaleString("en-PK", { style: "currency", currency, minimumFractionDigits: 2 });

  const update = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        return recalc(updated);
      })
    );
  };

  const add = () => onChange([...items, emptyLine()]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-8 text-center text-xs">#</TableHead>
              <TableHead className="text-xs min-w-[200px]">Description</TableHead>
              <TableHead className="text-xs w-24 text-right">Qty</TableHead>
              <TableHead className="text-xs w-32 text-right">Rate</TableHead>
              <TableHead className="text-xs w-32 text-right">Amount</TableHead>
              <TableHead className="text-xs w-20 text-right">Tax %</TableHead>
              <TableHead className="text-xs w-32 text-right">Tax</TableHead>
              <TableHead className="text-xs w-36 text-right">Total</TableHead>
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={item.id} className="group">
                <TableCell className="text-center text-xs text-muted-foreground font-mono">
                  {idx + 1}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span className="text-sm">{item.description}</span>
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) => update(item.id, "description", e.target.value)}
                      className="h-8 text-sm border-0 shadow-none focus-visible:ring-1 bg-transparent"
                      placeholder="Item description"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <span className="text-sm font-mono">{item.quantity}</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => update(item.id, "quantity", Number(e.target.value))}
                      className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 bg-transparent font-mono"
                      min={0}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <span className="text-sm font-mono">{fmt(item.rate)}</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.rate || ""}
                      onChange={(e) => update(item.id, "rate", Number(e.target.value))}
                      className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 bg-transparent font-mono"
                      min={0}
                      step="0.01"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(item.amount)}</TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <span className="text-sm font-mono">{item.taxPercent}%</span>
                  ) : (
                    <Input
                      type="number"
                      value={item.taxPercent || ""}
                      onChange={(e) => update(item.id, "taxPercent", Number(e.target.value))}
                      className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 bg-transparent font-mono"
                      min={0}
                      max={100}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(item.taxAmount)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">{fmt(item.total)}</TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => remove(item.id)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={4} className="text-right text-xs font-semibold uppercase tracking-wider">
                Subtotal
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold">{fmt(subtotal)}</TableCell>
              <TableCell />
              <TableCell className="text-right font-mono text-sm font-semibold">{fmt(totalTax)}</TableCell>
              <TableCell className="text-right font-mono text-sm font-bold text-primary">{fmt(grandTotal)}</TableCell>
              {!readOnly && <TableCell />}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="size-3.5" />
          Add Line
        </Button>
      )}
    </div>
  );
}
