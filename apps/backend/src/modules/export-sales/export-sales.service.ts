import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateExportContractDto, CreateLCDto, UpdateLCStatusDto, CreateShippingDocDto } from './dto/export-sales.dto';

@Injectable()
export class ExportSalesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Export Contracts ---
  async createContract(organizationId: string, dto: CreateExportContractDto) {
    const quantity = new Prisma.Decimal(dto.quantity);
    const pricePerUnit = new Prisma.Decimal(dto.pricePerUnit);
    const totalValue = quantity.mul(pricePerUnit);

    return this.prisma.exportContract.create({
      data: {
        organizationId,
        contractNumber: dto.contractNumber,
        customerId: dto.customerId,
        buyerName: dto.buyerName,
        buyerCountry: dto.buyerCountry,
        riceVarietyId: dto.riceVarietyId,
        quantity,
        unit: dto.unit ?? 'MT',
        pricePerUnit,
        currency: dto.currency ?? 'USD',
        totalValue,
        incoterm: dto.incoterm,
        portOfLoading: dto.portOfLoading,
        portOfDischarge: dto.portOfDischarge,
        shipmentDate: dto.shipmentDate ? new Date(dto.shipmentDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async getContracts(organizationId: string, status?: string) {
    const where: Prisma.ExportContractWhereInput = { organizationId };
    if (status) where.status = status;
    return this.prisma.exportContract.findMany({
      where,
      include: { letterOfCredits: true, shippingDocs: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContractById(organizationId: string, id: string) {
    const contract = await this.prisma.exportContract.findFirst({
      where: { id, organizationId },
      include: { letterOfCredits: true, shippingDocs: true },
    });
    if (!contract) throw new NotFoundException('Export contract not found');
    return contract;
  }

  async updateContractStatus(organizationId: string, id: string, status: string) {
    const contract = await this.prisma.exportContract.findFirst({ where: { id, organizationId } });
    if (!contract) throw new NotFoundException('Export contract not found');
    return this.prisma.exportContract.update({ where: { id }, data: { status } });
  }

  // --- Letters of Credit ---
  async createLC(organizationId: string, dto: CreateLCDto) {
    return this.prisma.letterOfCredit.create({
      data: {
        organizationId,
        exportContractId: dto.exportContractId,
        lcNumber: dto.lcNumber,
        issuingBank: dto.issuingBank,
        advisingBank: dto.advisingBank,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'USD',
        issueDate: new Date(dto.issueDate),
        expiryDate: new Date(dto.expiryDate),
        shipmentDeadline: dto.shipmentDeadline ? new Date(dto.shipmentDeadline) : undefined,
        terms: dto.terms,
        status: 'DRAFT_LC',
      },
    });
  }

  async updateLCStatus(organizationId: string, id: string, dto: UpdateLCStatusDto) {
    const lc = await this.prisma.letterOfCredit.findFirst({ where: { id, organizationId } });
    if (!lc) throw new NotFoundException('Letter of Credit not found');
    return this.prisma.letterOfCredit.update({ where: { id }, data: { status: dto.status } });
  }

  async getLCs(organizationId: string, contractId?: string) {
    const where: Prisma.LetterOfCreditWhereInput = { organizationId };
    if (contractId) where.exportContractId = contractId;
    return this.prisma.letterOfCredit.findMany({
      where,
      include: { exportContract: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  // --- Shipping Documents ---
  async createShippingDoc(organizationId: string, dto: CreateShippingDocDto) {
    return this.prisma.shippingDocument.create({
      data: {
        organizationId,
        exportContractId: dto.exportContractId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        containerNumber: dto.containerNumber,
        vesselName: dto.vesselName,
        billOfLading: dto.billOfLading,
        shippingDate: dto.shippingDate ? new Date(dto.shippingDate) : undefined,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : undefined,
        weight: dto.weight ? new Prisma.Decimal(dto.weight) : undefined,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
      },
    });
  }

  async getShippingDocs(organizationId: string, contractId?: string) {
    const where: Prisma.ShippingDocumentWhereInput = { organizationId };
    if (contractId) where.exportContractId = contractId;
    return this.prisma.shippingDocument.findMany({
      where,
      include: { exportContract: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Export Dashboard ---
  async getExportDashboard(organizationId: string) {
    const contracts = await this.prisma.exportContract.findMany({ where: { organizationId } });
    const lcs = await this.prisma.letterOfCredit.findMany({ where: { organizationId } });

    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((s, c) => s + Number(c.totalValue), 0);
    const activeContracts = contracts.filter((c) => c.status === 'CONFIRMED' || c.status === 'SHIPPED').length;
    const pendingLCs = lcs.filter((l) => l.status === 'DRAFT_LC' || l.status === 'OPENED').length;
    const countryBreakdown = new Map<string, number>();
    for (const c of contracts) {
      countryBreakdown.set(c.buyerCountry, (countryBreakdown.get(c.buyerCountry) ?? 0) + Number(c.totalValue));
    }

    return {
      totalContracts,
      activeContracts,
      totalValue,
      pendingLCs,
      totalLCs: lcs.length,
      countryBreakdown: Array.from(countryBreakdown.entries()).map(([country, value]) => ({ country, value })),
    };
  }
}
