import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateProductionBatchDto,
  CompleteBatchDto,
  CreateMillingRecordDto,
} from './dto/production.dto';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(
    organizationId: string,
    userId: string,
    dto: CreateProductionBatchDto,
  ) {
    const variety = await this.prisma.riceVariety.findFirst({
      where: { id: dto.inputVarietyId, organizationId },
    });
    if (!variety) throw new NotFoundException('Input rice variety not found');

    return this.prisma.$transaction(async (tx) => {
      const batchNumber = await this.generateBatchNumber(tx, organizationId);

      return tx.productionBatch.create({
        data: {
          organizationId,
          branchId: dto.branchId,
          batchNumber,
          date: new Date(dto.date),
          inputVarietyId: dto.inputVarietyId,
          inputLotNumber: dto.inputLotNumber,
          inputWeight: dto.inputWeight,
          processType: dto.processType,
          notes: dto.notes,
          createdBy: userId,
        },
        include: {
          inputVariety: true,
          branch: true,
        },
      });
    });
  }

  async startBatch(organizationId: string, id: string) {
    const batch = await this.getBatch(organizationId, id);
    if (batch.status !== 'PLANNED') {
      throw new BadRequestException('Only planned batches can be started');
    }

    return this.prisma.productionBatch.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: { inputVariety: true, branch: true },
    });
  }

  async completeBatch(
    organizationId: string,
    id: string,
    dto: CompleteBatchDto,
  ) {
    const batch = await this.getBatch(organizationId, id);
    if (batch.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Only in-progress batches can be completed',
      );
    }

    if (!dto.outputs || dto.outputs.length === 0) {
      throw new BadRequestException('At least one output is required');
    }

    const totalOutputWeight = dto.outputs.reduce(
      (sum, o) => sum + o.outputWeight,
      0,
    );
    const inputWeight = Number(batch.inputWeight);

    if (totalOutputWeight > inputWeight * 1.05) {
      throw new BadRequestException(
        `Total output weight (${totalOutputWeight}) exceeds input weight (${inputWeight}) by more than 5%`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const output of dto.outputs) {
        const recoveryPercentage =
          output.recoveryPercentage ??
          Math.round((output.outputWeight / inputWeight) * 10000) / 100;

        await tx.productionOutput.create({
          data: {
            batchId: id,
            outputVarietyId: output.outputVarietyId,
            outputWeight: output.outputWeight,
            recoveryPercentage,
            grade: output.grade as
              | 'A_PLUS'
              | 'A'
              | 'B'
              | 'C'
              | 'REJECT'
              | undefined,
            lotNumber: output.lotNumber,
            notes: output.notes,
          },
        });
      }

      if (dto.costs) {
        for (const cost of dto.costs) {
          await tx.productionCost.create({
            data: {
              batchId: id,
              costType: cost.costType,
              description: cost.description,
              amount: cost.amount,
            },
          });
        }
      }

      return tx.productionBatch.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: {
          inputVariety: true,
          branch: true,
          outputs: { include: { outputVariety: true } },
          costs: true,
        },
      });
    });
  }

  async cancelBatch(organizationId: string, id: string) {
    const batch = await this.getBatch(organizationId, id);
    if (batch.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed batch');
    }

    return this.prisma.productionBatch.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { inputVariety: true, branch: true },
    });
  }

  async getBatch(organizationId: string, id: string) {
    const batch = await this.prisma.productionBatch.findFirst({
      where: { id, organizationId },
      include: {
        inputVariety: true,
        branch: true,
        outputs: { include: { outputVariety: true } },
        costs: true,
        millingRecords: true,
      },
    });
    if (!batch) throw new NotFoundException('Production batch not found');
    return batch;
  }

  async listBatches(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    processType?: string,
  ) {
    const where: Prisma.ProductionBatchWhereInput = {
      organizationId,
      ...(status
        ? {
            status: status as
              | 'PLANNED'
              | 'IN_PROGRESS'
              | 'COMPLETED'
              | 'CANCELLED',
          }
        : {}),
      ...(processType
        ? {
            processType: processType as
              | 'SHELLING'
              | 'POLISHING'
              | 'SELLA'
              | 'STEAM'
              | 'SORTING'
              | 'GRADING'
              | 'CLEANING',
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.productionBatch.findMany({
        where,
        include: {
          inputVariety: true,
          branch: true,
          outputs: { include: { outputVariety: true } },
          costs: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productionBatch.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== MILLING RECORDS =====

  async createMillingRecord(
    organizationId: string,
    dto: CreateMillingRecordDto,
  ) {
    const batch = await this.getBatch(organizationId, dto.batchId);
    if (batch.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Milling records can only be added to in-progress batches',
      );
    }

    const riceOutputWeight = dto.riceOutputWeight;
    const paddyInputWeight = dto.paddyInputWeight;
    const recoveryPercentage =
      Math.round((riceOutputWeight / paddyInputWeight) * 10000) / 100;
    const brokenRatio = dto.brokenOutputWeight
      ? Math.round((dto.brokenOutputWeight / riceOutputWeight) * 10000) / 100
      : 0;

    return this.prisma.millingRecord.create({
      data: {
        batchId: dto.batchId,
        paddyInputWeight: dto.paddyInputWeight,
        riceOutputWeight: dto.riceOutputWeight,
        brokenOutputWeight: dto.brokenOutputWeight ?? 0,
        huskWeight: dto.huskWeight ?? 0,
        branWeight: dto.branWeight ?? 0,
        recoveryPercentage,
        brokenRatio,
        notes: dto.notes,
      },
      include: { batch: true },
    });
  }

  // ===== PRODUCTION SUMMARY =====

  async getProductionSummary(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const batches = await this.prisma.productionBatch.findMany({
      where: {
        organizationId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
        status: 'COMPLETED',
      },
      include: {
        outputs: true,
        costs: true,
        millingRecords: true,
      },
    });

    let totalInputWeight = 0;
    let totalOutputWeight = 0;
    let totalCost = 0;

    const byProcess: Record<
      string,
      { count: number; inputWeight: number; outputWeight: number }
    > = {};

    for (const batch of batches) {
      const inputWeight = Number(batch.inputWeight);
      totalInputWeight += inputWeight;

      const batchOutputWeight = batch.outputs.reduce(
        (s, o) => s + Number(o.outputWeight),
        0,
      );
      totalOutputWeight += batchOutputWeight;

      totalCost += batch.costs.reduce((s, c) => s + Number(c.amount), 0);

      if (!byProcess[batch.processType]) {
        byProcess[batch.processType] = {
          count: 0,
          inputWeight: 0,
          outputWeight: 0,
        };
      }
      byProcess[batch.processType].count++;
      byProcess[batch.processType].inputWeight += inputWeight;
      byProcess[batch.processType].outputWeight += batchOutputWeight;
    }

    return {
      period: { fromDate, toDate },
      totalBatches: batches.length,
      totalInputWeight,
      totalOutputWeight,
      overallRecovery:
        totalInputWeight > 0
          ? Math.round((totalOutputWeight / totalInputWeight) * 10000) / 100
          : 0,
      totalCost,
      costPerUnit:
        totalOutputWeight > 0
          ? Math.round((totalCost / totalOutputWeight) * 100) / 100
          : 0,
      byProcess: Object.entries(byProcess).map(([type, data]) => ({
        processType: type,
        ...data,
        recovery:
          data.inputWeight > 0
            ? Math.round((data.outputWeight / data.inputWeight) * 10000) / 100
            : 0,
      })),
    };
  }

  private async generateBatchNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.productionBatch.count({ where: { organizationId } });
    return `PB-${String(count + 1).padStart(6, '0')}`;
  }
}
