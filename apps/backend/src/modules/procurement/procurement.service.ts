import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  Optional,
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
  CreatePurchaseOrderDto,
} from './dto/procurement.dto';
import { GeneralLedgerService } from '../accounting-engine/general-ledger.service';
import { StockLedgerService } from '../accounting-engine/stock-ledger.service';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(GeneralLedgerService) private readonly glService?: GeneralLedgerService,
    @Optional() @Inject(StockLedgerService) private readonly stockLedgerService?: StockLedgerService,
  ) {}

  // ===== SUPPLIERS =====

  async createSupplier(organizationId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        organizationId,
        name: dto.name,
        supplierCode: dto.supplierCode,
        supplierGroup: dto.supplierGroup,
        company: dto.company,
        phone: dto.phone,
        mobileNo: dto.mobileNo,
        email: dto.email,
        website: dto.website,
        address: dto.address,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        cnic: dto.cnic,
        ntn: dto.ntn,
        salesTaxNo: dto.salesTaxNo,
        fax: dto.fax,
        taxId: dto.taxId,
        panNo: dto.panNo,
        taxWithholdingCategory: dto.taxWithholdingCategory,
        supplierType: dto.supplierType ?? 'FARMER',
        paymentTermsDays: dto.paymentTermsDays,
        creditLimit: dto.creditLimit ?? 0,
        openingBalance: dto.openingBalance ?? 0,
        defaultCurrency: dto.defaultCurrency ?? 'PKR',
        defaultPayableAccountId: dto.defaultPayableAccountId,
        defaultBankAccountId: dto.defaultBankAccountId,
        defaultPriceListId: dto.defaultPriceListId,
        isTransporter: dto.isTransporter ?? false,
        isInternal: dto.isInternal ?? false,
        contactPerson: dto.contactPerson,
        allowPurchaseInvoiceCreationWithoutPO: dto.allowPurchaseInvoiceCreationWithoutPO ?? false,
        allowPurchaseInvoiceCreationWithoutReceipt: dto.allowPurchaseInvoiceCreationWithoutReceipt ?? false,
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
        itemGroup: dto.itemGroup,
        brand: dto.brand,
        hsnSacCode: dto.hsnSacCode,
        barcode: dto.barcode,
        stockUom: dto.stockUom ?? 'KG',
        hasVariants: dto.hasVariants ?? false,
        hasSerialNo: dto.hasSerialNo ?? false,
        hasBatchNo: dto.hasBatchNo ?? false,
        shelfLife: dto.shelfLife,
        defaultMoisture: dto.defaultMoisture,
        standardRate: dto.standardRate ?? 0,
        valuationRate: dto.valuationRate ?? 0,
        valuationMethod: dto.valuationMethod,
        minOrderQty: dto.minOrderQty ?? 0,
        safetyStock: dto.safetyStock ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        reorderQty: dto.reorderQty ?? 0,
        leadTimeDays: dto.leadTimeDays ?? 0,
        defaultWarehouseId: dto.defaultWarehouseId,
        defaultIncomeAccountId: dto.defaultIncomeAccountId,
        defaultExpenseAccountId: dto.defaultExpenseAccountId,
        defaultCostCenterId: dto.defaultCostCenterId,
        weightPerUnit: dto.weightPerUnit,
        weightUom: dto.weightUom,
        isSalesItem: dto.isSalesItem ?? true,
        isPurchaseItem: dto.isPurchaseItem ?? true,
        isStockItem: dto.isStockItem ?? true,
        openingStock: dto.openingStock ?? 0,
        openingStockRate: dto.openingStockRate ?? 0,
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

      const bardanaAmt = (dto as any).bardanaAmount ?? 0;
      const labourChg = (dto as any).labourCharges ?? 0;
      const transportChg = (dto as any).transportCharges ?? 0;
      const commRate = (dto as any).commissionRate ?? 0;
      const commAmt = (dto as any).commissionAmount ?? (commRate > 0 ? grossAmount * commRate / 100 : 0);
      const taxAmt = (dto as any).taxAmount ?? 0;
      const whtAmt = (dto as any).withholdingTaxAmount ?? 0;
      const totalCharges = bardanaAmt + labourChg + transportChg + commAmt;
      const finalNetAmount = grossAmount + totalCharges + taxAmt - whtAmt;
      const roundingAdj = Math.round(finalNetAmount) - finalNetAmount;

      const purchase = await tx.paddyPurchase.create({
        data: {
          organizationId,
          branchId: dto.branchId,
          purchaseNumber,
          date: new Date(dto.date),
          supplierId: dto.supplierId,
          riceVarietyId: dto.riceVarietyId,
          brokerId: dto.brokerId,
          namingSeries: (dto as any).namingSeries,
          costCenterId: (dto as any).costCenterId,
          projectId: (dto as any).projectId,
          warehouseId: (dto as any).warehouseId,
          currency: (dto as any).currency ?? 'PKR',
          exchangeRate: (dto as any).exchangeRate ?? 1,
          weighbridgeSlipId: (dto as any).weighbridgeSlipId,
          grossWeight: dto.grossWeight,
          tareWeight: dto.tareWeight ?? 0,
          netWeight,
          moisturePercentage: dto.moisturePercentage,
          brokenPercentage: (dto as any).brokenPercentage,
          foreignMatter: (dto as any).foreignMatter,
          deductionPercentage: dto.deductionPercentage,
          deductionWeight: moistureDeduction + percentDeduction,
          finalWeight,
          ratePerUnit: dto.ratePerUnit,
          grossAmount,
          bardanaAmount: bardanaAmt,
          labourCharges: labourChg,
          transportCharges: transportChg,
          commissionAmount: commAmt,
          commissionRate: commRate,
          deductions: {
            moisture: moistureDeduction,
            percentage: percentDeduction,
          },
          taxAmount: taxAmt,
          withholdingTaxAmount: whtAmt,
          roundingAdjustment: roundingAdj,
          netAmount: finalNetAmount + roundingAdj,
          outstandingAmount: finalNetAmount + roundingAdj,
          qualityGrade: dto.qualityGrade,
          lotNumber: dto.lotNumber,
          bagCount: (dto as any).bagCount,
          bagWeight: (dto as any).bagWeight,
          vehicleNumber: dto.vehicleNumber,
          driverName: (dto as any).driverName,
          driverPhone: (dto as any).driverPhone,
          gatePassNumber: dto.gatePassNumber,
          termsAndConditions: (dto as any).termsAndConditions,
          notes: dto.notes,
          remarks: (dto as any).remarks,
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
    }).then(async (result) => {
      // Post to centralized GL (enterprise accounting engine)
      if (this.glService) {
        try {
          const inventoryAccount = await this.prisma.chartOfAccount.findFirst({
            where: { organizationId, code: '1140' },
          });
          const payableAccount = await this.prisma.chartOfAccount.findFirst({
            where: { organizationId, code: '2110' },
          });

          if (inventoryAccount && payableAccount) {
            await this.glService.postToLedger(organizationId, userId, {
              voucherType: 'Paddy Purchase',
              voucherNo: purchase.purchaseNumber,
              voucherId: purchase.id,
              postingDate: new Date(purchase.date).toISOString().split('T')[0],
              journalEntryId: result.journalEntry.id,
              remarks: `Paddy purchase ${purchase.purchaseNumber} - ${purchase.supplier.name}`,
              entries: [
                {
                  accountId: inventoryAccount.id,
                  debit: Number(purchase.netAmount),
                  credit: 0,
                  remarks: `Paddy inventory - ${purchase.purchaseNumber}`,
                },
                {
                  accountId: payableAccount.id,
                  debit: 0,
                  credit: Number(purchase.netAmount),
                  partyType: 'SUPPLIER',
                  partyId: purchase.supplierId,
                  partyName: purchase.supplier.name,
                  remarks: `Payable - ${purchase.supplier.name}`,
                },
              ],
            });
          }
        } catch (glError) {
          console.warn('GL posting for paddy purchase failed:', glError);
        }
      }

      return result;
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
        grade: dto.overallGrade,
        testedBy: dto.testedBy,
        notes: dto.testNotes,
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

  // ===== PURCHASE ORDERS =====

  async createPurchaseOrder(
    organizationId: string,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    await this.getSupplier(organizationId, dto.supplierId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase order must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.purchaseOrder.count({ where: { organizationId } });
      const orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;
      const exchangeRate = dto.exchangeRate ?? 1;

      let totalAmount = 0;
      let totalQty = 0;
      let totalTaxAmount = 0;

      const itemsData = dto.items.map((item, idx) => {
        const qty = item.quantity;
        const rate = item.rate;
        const amount = qty * rate;
        const conversionFactor = item.conversionFactor ?? 1;
        const stockQty = qty * conversionFactor;
        const baseRate = rate * exchangeRate;
        const baseAmount = amount * exchangeRate;
        const discPct = item.discountPercentage ?? 0;
        const discAmt = item.discountAmount ?? (discPct > 0 ? amount * discPct / 100 : 0);
        const afterDiscount = amount - discAmt;
        const taxRate = item.taxRate ?? 0;
        const taxAmt = afterDiscount * taxRate / 100;
        const netAmt = afterDiscount + taxAmt;
        const netRate = qty > 0 ? netAmt / qty : 0;

        totalAmount += amount;
        totalQty += qty;
        totalTaxAmount += taxAmt;

        return {
          riceVarietyId: item.riceVarietyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description,
          quantity: qty,
          stockQty,
          unit: item.unit ?? 'KG',
          stockUom: item.stockUom ?? item.unit ?? 'KG',
          conversionFactor,
          priceListRate: item.priceListRate ?? rate,
          rate,
          baseRate,
          amount,
          baseAmount,
          discountPercentage: discPct,
          discountAmount: discAmt,
          taxRate,
          taxAmount: taxAmt,
          netAmount: netAmt,
          netRate,
          warehouseId: item.warehouseId,
          costCenterId: item.costCenterId,
          projectId: item.projectId,
          expenseAccountId: item.expenseAccountId,
          expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : null,
          idx,
        };
      });

      const discount = dto.discount ?? 0;
      const discountPct = dto.discountPercentage ?? 0;
      const additionalDiscount = discountPct > 0 ? totalAmount * discountPct / 100 : discount;
      const taxAmount = dto.taxAmount ?? totalTaxAmount;
      const netTotal = totalAmount - additionalDiscount;
      const grandTotal = netTotal + taxAmount;
      const roundingAdj = Math.round(grandTotal) - grandTotal;
      const roundedTotal = grandTotal + roundingAdj;
      const netAmount = roundedTotal;

      return tx.purchaseOrder.create({
        data: {
          organizationId,
          orderNumber,
          namingSeries: dto.namingSeries,
          date: new Date(dto.date),
          supplierId: dto.supplierId,
          supplierName: dto.supplierName,
          supplierAddress: dto.supplierAddress,
          branchId: dto.branchId,
          currency: dto.currency ?? 'PKR',
          exchangeRate,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          priceListId: dto.priceListId,
          totalQty,
          totalAmount,
          netTotal,
          discountPercentage: discountPct,
          discount: additionalDiscount,
          taxTemplateId: dto.taxTemplateId,
          taxesAndCharges: dto.taxesAndCharges ?? [],
          taxAmount,
          grandTotal,
          roundingAdjustment: roundingAdj,
          roundedTotal,
          netAmount,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
          paymentTerms: dto.paymentTerms,
          paymentTermsDays: dto.paymentTermsDays,
          shippingAddress: dto.shippingAddress,
          termsAndConditions: dto.termsAndConditions,
          letterHead: dto.letterHead,
          narration: dto.notes,
          createdBy: userId,
          items: { create: itemsData },
        },
        include: {
          supplier: true,
          items: { include: { riceVariety: true } },
        },
      });
    });
  }

  async listPurchaseOrders(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { organizationId },
        include: { supplier: true, items: { include: { riceVariety: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  async getPurchaseOrder(organizationId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { supplier: true, items: { include: { riceVariety: true } } },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  // ===== GOODS RECEIPT =====

  async createGoodsReceipt(
    organizationId: string,
    userId: string,
    dto: any,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Goods receipt must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.goodsReceipt.count({ where: { organizationId } });
      const receiptNumber = `GRN-${String(count + 1).padStart(6, '0')}`;
      const exchangeRate = dto.exchangeRate ?? 1;

      let totalQty = 0;
      let totalAmount = 0;

      const itemsData = dto.items.map((item: any, idx: number) => {
        const qty = item.quantity;
        const rate = item.rate ?? 0;
        const amount = qty * rate;
        const conversionFactor = item.conversionFactor ?? 1;
        const stockQty = qty * conversionFactor;
        const valuationRate = item.valuationRate ?? rate;

        totalQty += qty;
        totalAmount += amount;

        return {
          riceVarietyId: item.riceVarietyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description ?? '',
          quantity: qty,
          receivedQty: qty,
          stockQty,
          unit: item.unit ?? 'KG',
          stockUom: item.stockUom ?? item.unit ?? 'KG',
          conversionFactor,
          rate,
          amount,
          valuationRate,
          acceptedQty: item.acceptedQty ?? qty,
          rejectedQty: item.rejectedQty ?? 0,
          warehouseId: item.warehouseId ?? dto.warehouseId,
          rejectedWarehouseId: item.rejectedWarehouseId ?? dto.rejectedWarehouseId,
          costCenterId: item.costCenterId ?? dto.costCenterId,
          projectId: item.projectId ?? dto.projectId,
          batchNo: item.batchNo,
          serialNo: item.serialNo,
          lotNumber: item.lotNumber,
          purchaseOrderItemId: item.purchaseOrderItemId,
          idx,
        };
      });

      return tx.goodsReceipt.create({
        data: {
          organizationId,
          receiptNumber,
          namingSeries: dto.namingSeries,
          date: new Date(dto.date),
          postingTime: dto.postingTime,
          supplierId: dto.supplierId,
          supplierName: dto.supplierName,
          supplierAddress: dto.supplierAddress,
          purchaseOrderId: dto.purchaseOrderId,
          warehouseId: dto.warehouseId,
          rejectedWarehouseId: dto.rejectedWarehouseId,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          currency: dto.currency ?? 'PKR',
          exchangeRate,
          isReturn: dto.isReturn ?? false,
          returnAgainst: dto.returnAgainst,
          totalQty,
          totalQuantity: totalQty,
          totalNetWeight: totalAmount,
          vehicleNumber: dto.vehicleNumber,
          driverName: dto.driverName,
          transporterName: dto.transporterName,
          lrNo: dto.lrNo,
          lrDate: dto.lrDate ? new Date(dto.lrDate) : null,
          termsAndConditions: dto.termsAndConditions,
          notes: dto.notes,
          remarks: dto.remarks,
          createdBy: userId,
          items: { create: itemsData },
        },
        include: {
          supplier: true,
          items: { include: { riceVariety: true } },
        },
      });
    });
  }

  async listGoodsReceipts(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where: { organizationId },
        include: { supplier: true, items: { include: { riceVariety: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.goodsReceipt.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  private async generatePurchaseNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.paddyPurchase.count({ where: { organizationId } });
    return `PP-${String(count + 1).padStart(6, '0')}`;
  }
}
