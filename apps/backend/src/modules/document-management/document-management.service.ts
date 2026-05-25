import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDocumentDto, CreateDocumentVersionDto, CreateContractDto } from './dto/document.dto';

@Injectable()
export class DocumentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Documents ---
  async createDocument(organizationId: string, dto: CreateDocumentDto, uploadedBy?: string) {
    return this.prisma.document.create({
      data: {
        organizationId,
        title: dto.title,
        documentType: dto.documentType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        tags: dto.tags ?? [],
        description: dto.description,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        uploadedBy,
      },
    });
  }

  async getDocuments(organizationId: string, entityType?: string, entityId?: string) {
    const where: Prisma.DocumentWhereInput = { organizationId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return this.prisma.document.findMany({
      where,
      include: { versions: { orderBy: { version: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentById(organizationId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId },
      include: { versions: { orderBy: { version: 'desc' } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async addVersion(organizationId: string, documentId: string, dto: CreateDocumentVersionDto, uploadedBy?: string) {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, organizationId } });
    if (!doc) throw new NotFoundException('Document not found');

    const newVersion = doc.version + 1;
    return this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.create({
        data: {
          documentId,
          version: newVersion,
          fileUrl: dto.fileUrl,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          changeNote: dto.changeNote,
          uploadedBy,
        },
      });
      return tx.document.update({
        where: { id: documentId },
        data: {
          version: newVersion,
          fileUrl: dto.fileUrl,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
        },
        include: { versions: { orderBy: { version: 'desc' } } },
      });
    });
  }

  async archiveDocument(organizationId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.document.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async searchDocuments(organizationId: string, query: string) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { fileName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpiringDocuments(organizationId: string, daysAhead: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return this.prisma.document.findMany({
      where: {
        organizationId,
        expiryDate: { lte: futureDate, gte: new Date() },
        status: 'ACTIVE_DOC',
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // --- Contracts ---
  async createContract(organizationId: string, dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        organizationId,
        contractNumber: dto.contractNumber,
        title: dto.title,
        contractType: dto.contractType,
        partyType: dto.partyType,
        partyId: dto.partyId,
        partyName: dto.partyName,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        value: dto.value ? new Prisma.Decimal(dto.value) : undefined,
        currency: dto.currency ?? 'PKR',
        terms: dto.terms,
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
        autoRenew: dto.autoRenew ?? false,
        signedBy: dto.signedBy,
      },
    });
  }

  async getContracts(organizationId: string, status?: string) {
    const where: Prisma.ContractWhereInput = { organizationId };
    if (status) where.status = status as 'DRAFT_DOC' | 'ACTIVE_DOC' | 'ARCHIVED' | 'EXPIRED';
    return this.prisma.contract.findMany({ where, orderBy: { startDate: 'desc' } });
  }

  async getContractById(organizationId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id, organizationId } });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async getExpiringContracts(organizationId: string, daysAhead: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return this.prisma.contract.findMany({
      where: {
        organizationId,
        endDate: { lte: futureDate, gte: new Date() },
        status: 'ACTIVE_DOC',
      },
      orderBy: { endDate: 'asc' },
    });
  }
}
