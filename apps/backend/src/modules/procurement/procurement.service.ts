import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateRiceVarietyDto,
  CreatePaddyPurchaseDto,
  CreatePurchaseRateDto,
  CreateQualityTestDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== SUPPLIERS =====

  async createSupplier(organizationId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        organizationId,
        name: dto.name,
        company: dto.company,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        cnic: dto.cnic,
        ntn: dto.ntn,
        supplierType: dto.supplierType ?? 'FARMER',
        creditLimit: dto.creditLimit ?? 0,
        openingBalance: dto.openingBalance ?? 0,
      },
    });
  }

  async listSuppliers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const where: Prisma.SupplierWhereInput = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getSupplier(organizationId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        _count: { select: { paddyPurchases: true } },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateSupplier(
    organizationId: string,
    id: string,
    dto: UpdateSupplierDto,
  ) {
    await this.getSupplier(organizationId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  // ===== RICE VARIETIES =====

  async createRiceVariety(organizationId: string, dto: CreateRiceVarietyDto) {
    const existing = await this.prisma.riceVariety.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing)
      throw new ConflictException(
        `Rice variety code ${dto.code} already exists`,
      );

    return this.prisma.riceVariety.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        riceType: dto.riceType,
        category: dto.category,
        defaultMoisture: dto.defaultMoisture,
        description: dto.description,
      },
    });
  }

  async listRiceVarieties(organizationId: string) {
    return this.prisma.riceVariety.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRiceVariety(organizationId: string, id: string) {
    const variety = await this.prisma.riceVariety.findFirst({
      where: { id, organizationId },
    });
    if (!variety) throw new NotFoundException('Rice variety not found');
    return variety;
  }

  // ===== PADDY PURCHASES =====

  async createPaddyPurchase(
    organizationId: string,
    userId: string,
    dto: CreatePaddyPurchaseDto,
  ) {
    await this.getSupplier(organizationId, dto.supplierId);
    await this.getRiceVariety(organizationId, dto.riceVarietyId);

    const netWeight = dto.grossWeight - (dto.tareWeight ?? 0);
    if (netWeight <= 0)
      throw new BadRequestException('Net weight must be positive');

    let moistureDeduction = 0;
    if (dto.moisturePercentage && dto.moisturePercentage > 14) {
      moistureDeduction = ((dto.moisturePercentage - 14) / 100) * netWeight;
    }

    const percentDeduction = dto.deductionPercentage
      ? (dto.deductionPercentage / 100) * netWeight
      : 0;

    const finalWeight = netWeight - moistureDeduction - percentDeduction;
    const grossAmount = finalWeight * dto.ratePerUnit;
    const netAmount = grossAmount;

    return this.prisma.$transaction(async (tx) => {
      const purchaseNumber = await this.generatePurchaseNumber(
        tx,
        organizationId,
      );

      const purchase = await tx.paddyPurchase.create({
        data: {
          organizationId,
          branchId: dto.branchId,
          purchaseNumber,
          date: new Date(dto.date),
          supplierId: dto.supplierId,
          riceVarietyId: dto.riceVarietyId,
          brokerId: dto.brokerId,
          grossWeight: dto.grossWeight,
          tareWeight: dto.tareWeight ?? 0,
          netWeight,
          moisturePercentage: dto.moisturePercentage,
          deductionPercentage: dto.deductionPercentage,
          finalWeight,
          ratePerUnit: dto.ratePerUnit,
          grossAmount,
          deductions: {
            moisture: moistureDeduction,
            percentage: percentDeduction,
          },
          netAmount,
          qualityGrade: dto.qualityGrade,
          lotNumber: dto.lotNumber,
          vehicleNumber: dto.vehicleNumber,
          gatePassNumber: dto.gatePassNumber,
          notes: dto.notes,
          createdBy: userId,
        },
        include: {
          supplier: true,
          riceVariety: true,
          broker: true,
          branch: true,
        },
      });

      return purchase;
    });
  }

  async postPurchaseToAccounts(
    organizationId: string,
    userId: string,
    purchaseId: string,
    fiscalYearId: string,
  ) {
    const purchase = await this.prisma.paddyPurchase.findFirst({
      where: { id: purchaseId, organizationId },
      include: { supplier: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.journalEntryId)
      throw new BadRequestException('Purchase already posted to accounts');

    return this.prisma.$transaction(async (tx) => {
      const purchaseAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '5110' },
      });
      const payableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2110' },
      });
      const inventoryAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1140' },
      });

      if (!purchaseAccount || !payableAccount || !inventoryAccount) {
        throw new NotFoundException('Required accounts not found in COA');
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(purchase.date),
          reference: purchase.purchaseNumber,
          narration: `Paddy purchase ${purchase.purchaseNumber} from ${purchase.supplier.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: inventoryAccount.id,
                debit: Number(purchase.netAmount),
                credit: 0,
                narration: `Paddy inventory - ${purchase.purchaseNumber}`,
              },
              {
                accountId: payableAccount.id,
                debit: 0,
                credit: Number(purchase.netAmount),
                narration: `Payable to ${purchase.supplier.name}`,
              },
            ],
          },
        },
      });

      await tx.paddyPurchase.update({
        where: { id: purchaseId },
        data: { journalEntryId: journalEntry.id },
      });

      return { purchase, journalEntry };
    });
  }

  async listPaddyPurchases(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    supplierId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: Prisma.PaddyPurchaseWhereInput = {
      organizationId,
      deletedAt: null,
      ...(supplierId ? { supplierId } : {}),
    };

    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.paddyPurchase.findMany({
        where,
        include: {
          supplier: true,
          riceVariety: true,
          broker: true,
          branch: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paddyPurchase.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getPaddyPurchase(organizationId: string, id: string) {
    const purchase = await this.prisma.paddyPurchase.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        supplier: true,
        riceVariety: true,
        broker: true,
        branch: true,
        qualityTests: true,
        journalEntry: { include: { lines: { include: { account: true } } } },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  // ===== PURCHASE RATES =====

  async createPurchaseRate(organizationId: string, dto: CreatePurchaseRateDto) {
    await this.getRiceVariety(organizationId, dto.riceVarietyId);

    if (dto.effectiveTo) {
      await this.prisma.purchaseRate.updateMany({
        where: {
          organizationId,
          riceVarietyId: dto.riceVarietyId,
          isActive: true,
          effectiveTo: null,
        },
        data: {
          effectiveTo: new Date(dto.effectiveFrom),
          isActive: false,
        },
      });
    }

    return this.prisma.purchaseRate.create({
      data: {
        organizationId,
        riceVarietyId: dto.riceVarietyId,
        rate: dto.rate,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        minMoisture: dto.minMoisture,
        maxMoisture: dto.maxMoisture,
      },
      include: { riceVariety: true },
    });
  }

  async getCurrentRate(organizationId: string, riceVarietyId: string) {
    const rate = await this.prisma.purchaseRate.findFirst({
      where: {
        organizationId,
        riceVarietyId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      include: { riceVariety: true },
    });

    if (!rate)
      throw new NotFoundException('No active rate found for this variety');
    return rate;
  }

  async listPurchaseRates(organizationId: string, riceVarietyId?: string) {
    return this.prisma.purchaseRate.findMany({
      where: {
        organizationId,
        ...(riceVarietyId ? { riceVarietyId } : {}),
      },
      include: { riceVariety: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // ===== QUALITY TESTS =====

  async createQualityTest(organizationId: string, dto: CreateQualityTestDto) {
    await this.getPaddyPurchase(organizationId, dto.paddyPurchaseId);

    return this.prisma.qualityTest.create({
      data: {
        paddyPurchaseId: dto.paddyPurchaseId,
        testDate: new Date(dto.testDate),
        moisture: dto.moisture,
        brokenPercentage: dto.brokenPercentage,
        foreignMatter: dto.foreignMatter,
        chalkyGrains: dto.chalkyGrains,
        damagedGrains: dto.damagedGrains,
        grade: dto.grade,
        testedBy: dto.testedBy,
        notes: dto.notes,
      },
      include: { paddyPurchase: true },
    });
  }

  async getQualityTests(organizationId: string, purchaseId: string) {
    await this.getPaddyPurchase(organizationId, purchaseId);
    return this.prisma.qualityTest.findMany({
      where: { paddyPurchaseId: purchaseId },
      orderBy: { testDate: 'desc' },
    });
  }

  // ===== PROCUREMENT SUMMARY =====

  async getProcurementSummary(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const purchases = await this.prisma.paddyPurchase.findMany({
      where: {
        organizationId,
        deletedAt: null,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: { riceVariety: true, supplier: true },
    });

    const totalPurchases = purchases.length;
    let totalWeight = 0;
    let totalAmount = 0;

    const byVariety: Record<
      string,
      { name: string; weight: number; amount: number; count: number }
    > = {};
    const bySupplier: Record<
      string,
      { name: string; weight: number; amount: number; count: number }
    > = {};

    for (const p of purchases) {
      const weight = Number(p.finalWeight);
      const amount = Number(p.netAmount);
      totalWeight += weight;
      totalAmount += amount;

      if (!byVariety[p.riceVarietyId]) {
        byVariety[p.riceVarietyId] = {
          name: p.riceVariety.name,
          weight: 0,
          amount: 0,
          count: 0,
        };
      }
      byVariety[p.riceVarietyId].weight += weight;
      byVariety[p.riceVarietyId].amount += amount;
      byVariety[p.riceVarietyId].count++;

      if (!bySupplier[p.supplierId]) {
        bySupplier[p.supplierId] = {
          name: p.supplier.name,
          weight: 0,
          amount: 0,
          count: 0,
        };
      }
      bySupplier[p.supplierId].weight += weight;
      bySupplier[p.supplierId].amount += amount;
      bySupplier[p.supplierId].count++;
    }

    return {
      period: { fromDate, toDate },
      totalPurchases,
      totalWeight,
      totalAmount,
      averageRate: totalWeight > 0 ? totalAmount / totalWeight : 0,
      byVariety: Object.values(byVariety),
      bySupplier: Object.values(bySupplier),
    };
  }

  private async generatePurchaseNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.paddyPurchase.count({ where: { organizationId } });
    return `PP-${String(count + 1).padStart(6, '0')}`;
  }
}
