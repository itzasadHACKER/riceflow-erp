import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateQualityInspectionDto,
  UpdateInspectionStatusDto,
  QualityFilterDto,
} from './dto/quality.dto';

@Injectable()
export class QualityControlService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInspectionNumber(
    organizationId: string,
  ): Promise<string> {
    const count = await this.prisma.qualityInspection.count({
      where: { organizationId },
    });
    return `QC-${String(count + 1).padStart(6, '0')}`;
  }

  async createInspection(
    organizationId: string,
    dto: CreateQualityInspectionDto,
    inspectedBy?: string,
  ) {
    const inspectionNumber =
      await this.generateInspectionNumber(organizationId);

    return this.prisma.qualityInspection.create({
      data: {
        organizationId,
        inspectionNumber,
        date: new Date(dto.date),
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        riceVarietyId: dto.riceVarietyId,
        lotNumber: dto.lotNumber,
        sampleSize: dto.sampleSize
          ? new Prisma.Decimal(dto.sampleSize)
          : undefined,
        moisture: dto.moisture ? new Prisma.Decimal(dto.moisture) : undefined,
        brokenPercentage: dto.brokenPercentage
          ? new Prisma.Decimal(dto.brokenPercentage)
          : undefined,
        foreignMatter: dto.foreignMatter
          ? new Prisma.Decimal(dto.foreignMatter)
          : undefined,
        chalkyGrains: dto.chalkyGrains
          ? new Prisma.Decimal(dto.chalkyGrains)
          : undefined,
        damagedGrains: dto.damagedGrains
          ? new Prisma.Decimal(dto.damagedGrains)
          : undefined,
        discolored: dto.discolored
          ? new Prisma.Decimal(dto.discolored)
          : undefined,
        grainLength: dto.grainLength
          ? new Prisma.Decimal(dto.grainLength)
          : undefined,
        grainWidth: dto.grainWidth
          ? new Prisma.Decimal(dto.grainWidth)
          : undefined,
        aroma: dto.aroma,
        cookingQuality: dto.cookingQuality,
        grade: dto.grade,
        remarks: dto.remarks,
        inspectedBy,
      },
    });
  }

  async getInspections(organizationId: string, filter: QualityFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.QualityInspectionWhereInput = { organizationId };
    if (filter.status) where.status = filter.status;
    if (filter.referenceType) where.referenceType = filter.referenceType;
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.qualityInspection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.qualityInspection.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getInspectionById(organizationId: string, id: string) {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id, organizationId },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  async updateInspectionStatus(
    organizationId: string,
    id: string,
    dto: UpdateInspectionStatusDto,
    inspectedBy?: string,
  ) {
    await this.getInspectionById(organizationId, id);
    return this.prisma.qualityInspection.update({
      where: { id },
      data: {
        status: dto.status,
        grade: dto.grade,
        remarks: dto.remarks,
        certificateNumber: dto.certificateNumber,
        inspectedBy,
      },
    });
  }

  async getQualitySummary(organizationId: string) {
    const inspections = await this.prisma.qualityInspection.findMany({
      where: { organizationId },
    });
    const total = inspections.length;
    const passed = inspections.filter((i) => i.status === 'PASSED').length;
    const failed = inspections.filter((i) => i.status === 'FAILED').length;
    const pending = inspections.filter(
      (i) => i.status === 'PENDING_INSPECTION',
    ).length;
    const conditional = inspections.filter(
      (i) => i.status === 'CONDITIONAL',
    ).length;

    let avgMoisture = new Prisma.Decimal(0);
    let avgBroken = new Prisma.Decimal(0);
    let moistureCount = 0;
    let brokenCount = 0;

    for (const ins of inspections) {
      if (ins.moisture) {
        avgMoisture = avgMoisture.add(ins.moisture);
        moistureCount++;
      }
      if (ins.brokenPercentage) {
        avgBroken = avgBroken.add(ins.brokenPercentage);
        brokenCount++;
      }
    }

    return {
      total,
      passed,
      failed,
      pending,
      conditional,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00',
      averageMoisture:
        moistureCount > 0 ? avgMoisture.div(moistureCount).toFixed(2) : '0.00',
      averageBrokenPercentage:
        brokenCount > 0 ? avgBroken.div(brokenCount).toFixed(2) : '0.00',
    };
  }
}
