import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountingEngineService } from './accounting-engine.service';

interface ParsedRow {
  [key: string]: string;
}

@Injectable()
export class CsvImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingEngine: AccountingEngineService,
  ) {}

  parseCsv(csvText: string): ParsedRow[] {
    const lines = csvText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must have a header row and at least one data row');
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: ParsedRow = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = (values[j] || '').trim();
      }
      rows.push(row);
    }

    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  async importCustomersCsv(organizationId: string, csvText: string) {
    const rows = this.parseCsv(csvText);
    this.validateHeaders(rows, ['name']);

    const customers = rows.map((row) => ({
      name: row['name'] || row['customer_name'] || row['customername'] || '',
      phone: row['phone'] || row['mobile'] || row['contact'] || undefined,
      email: row['email'] || undefined,
      address: row['address'] || undefined,
      openingBalance: row['opening_balance'] || row['openingbalance'] || row['balance']
        ? parseFloat(row['opening_balance'] || row['openingbalance'] || row['balance'])
        : undefined,
    })).filter((c) => c.name.length > 0);

    if (customers.length === 0) {
      throw new BadRequestException('No valid customer records found in CSV');
    }

    return this.accountingEngine.importCustomers(organizationId, customers);
  }

  async importSuppliersCsv(organizationId: string, csvText: string) {
    const rows = this.parseCsv(csvText);
    this.validateHeaders(rows, ['name']);

    const suppliers = rows.map((row) => ({
      name: row['name'] || row['supplier_name'] || row['suppliername'] || row['vendor'] || '',
      phone: row['phone'] || row['mobile'] || row['contact'] || undefined,
      email: row['email'] || undefined,
      address: row['address'] || undefined,
      openingBalance: row['opening_balance'] || row['openingbalance'] || row['balance']
        ? parseFloat(row['opening_balance'] || row['openingbalance'] || row['balance'])
        : undefined,
    })).filter((s) => s.name.length > 0);

    if (suppliers.length === 0) {
      throw new BadRequestException('No valid supplier records found in CSV');
    }

    return this.accountingEngine.importSuppliers(organizationId, suppliers);
  }

  async importItemsCsv(organizationId: string, csvText: string) {
    const rows = this.parseCsv(csvText);
    this.validateHeaders(rows, ['lotnumber']);

    const items = rows.map((row) => ({
      lotNumber: row['lotnumber'] || row['lot_number'] || row['lot'] || '',
      warehouseId: row['warehouseid'] || row['warehouse_id'] || row['warehouse'] || '',
      riceVarietyId: row['ricevarietyid'] || row['rice_variety_id'] || row['variety'] || '',
      quantity: parseFloat(row['quantity'] || row['qty'] || '0'),
      unit: row['unit'] || 'KG',
      valuationRate: row['valuationrate'] || row['valuation_rate'] || row['rate']
        ? parseFloat(row['valuationrate'] || row['valuation_rate'] || row['rate'])
        : undefined,
    })).filter((item) => item.lotNumber.length > 0 && item.quantity > 0);

    if (items.length === 0) {
      throw new BadRequestException('No valid item records found in CSV');
    }

    return this.accountingEngine.importItems(organizationId, items);
  }

  async importOpeningBalancesCsv(organizationId: string, csvText: string) {
    const rows = this.parseCsv(csvText);
    this.validateHeaders(rows, ['accountcode']);

    const balances = rows.map((row) => ({
      accountCode: row['accountcode'] || row['account_code'] || row['code'] || '',
      debit: parseFloat(row['debit'] || row['dr'] || '0'),
      credit: parseFloat(row['credit'] || row['cr'] || '0'),
    })).filter((b) => b.accountCode.length > 0);

    if (balances.length === 0) {
      throw new BadRequestException('No valid balance records found in CSV');
    }

    return this.accountingEngine.importOpeningBalances(organizationId, balances);
  }

  async importPartyBalancesCsv(
    organizationId: string,
    csvText: string,
    partyType: 'customer' | 'supplier',
  ) {
    const rows = this.parseCsv(csvText);
    this.validateHeaders(rows, ['name', 'balance']);

    const results = { updated: 0, notFound: 0, total: rows.length, errors: [] as string[] };

    for (const row of rows) {
      const name = row['name'] || row['party_name'] || row['partyname'] || '';
      const balance = parseFloat(row['balance'] || row['opening_balance'] || row['openingbalance'] || '0');
      const balanceType = (row['type'] || row['balance_type'] || 'debit').toLowerCase();

      if (!name) continue;

      if (partyType === 'customer') {
        const customer = await this.findCustomerByName(organizationId, name);
        if (!customer) {
          results.notFound++;
          results.errors.push(`Customer not found: ${name}`);
          continue;
        }
        await this.updateCustomerBalance(customer.id, balance, balanceType);
        results.updated++;
      } else {
        const supplier = await this.findSupplierByName(organizationId, name);
        if (!supplier) {
          results.notFound++;
          results.errors.push(`Supplier not found: ${name}`);
          continue;
        }
        await this.updateSupplierBalance(supplier.id, balance, balanceType);
        results.updated++;
      }
    }

    return results;
  }

  getSampleCsv(type: 'customers' | 'suppliers' | 'items' | 'opening_balances' | 'party_balances'): string {
    switch (type) {
      case 'customers':
        return 'name,phone,email,address,opening_balance\nAhmad Rice Traders,0300-1234567,ahmad@email.com,"Katchery Road, Lahore",50000\nKhalid Exports,0321-7654321,khalid@email.com,"GT Road, Gujranwala",0';
      case 'suppliers':
        return 'name,phone,email,address,opening_balance\nFarmer Ali,0345-1112233,,Village Nawan Pind,25000\nPaddy Suppliers Co,0312-9998877,info@paddyco.com,"Mandi Bahauddin",100000';
      case 'items':
        return 'lot_number,warehouse_id,rice_variety_id,quantity,unit,valuation_rate\nLOT-2025-001,warehouse-uuid-here,variety-uuid-here,5000,KG,85.50\nLOT-2025-002,warehouse-uuid-here,variety-uuid-here,3000,KG,92.00';
      case 'opening_balances':
        return 'account_code,debit,credit\n1001,500000,0\n1002,200000,0\n1003,150000,0\n2001,0,400000\n2002,0,100000\n3001,0,350000';
      case 'party_balances':
        return 'name,balance,type\nAhmad Rice Traders,50000,debit\nKhalid Exports,25000,debit\nFarmer Ali,100000,credit';
    }
  }

  private validateHeaders(rows: ParsedRow[], requiredFields: string[]) {
    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }
    const headers = Object.keys(rows[0]);
    const normalizedHeaders = headers.map((h) => h.replace(/[_\s-]/g, '').toLowerCase());

    for (const field of requiredFields) {
      const normalized = field.replace(/[_\s-]/g, '').toLowerCase();
      const found = normalizedHeaders.some((h) => h.includes(normalized));
      if (!found) {
        throw new BadRequestException(
          `Required column '${field}' not found in CSV. Found columns: ${headers.join(', ')}`,
        );
      }
    }
  }

  private async findCustomerByName(organizationId: string, name: string) {
    return this.prisma.customer.findFirst({
      where: { organizationId, name: { contains: name, mode: 'insensitive' as const } },
    });
  }

  private async findSupplierByName(organizationId: string, name: string) {
    return this.prisma.supplier.findFirst({
      where: { organizationId, name: { contains: name, mode: 'insensitive' as const } },
    });
  }

  private async updateCustomerBalance(customerId: string, balance: number, balanceType: string) {
    const actualBalance = balanceType === 'credit' ? -balance : balance;
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { openingBalance: actualBalance },
    });
  }

  private async updateSupplierBalance(supplierId: string, balance: number, balanceType: string) {
    const actualBalance = balanceType === 'credit' ? -balance : balance;
    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: { openingBalance: actualBalance },
    });
  }
}
