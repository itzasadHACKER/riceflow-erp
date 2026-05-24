import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMachineDto, CreateMaintenanceLogDto, CreateSpareDto, CreateDowntimeDto } from './dto/machine.dto';

@Injectable()
export class MachineService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Machine CRUD ---
  async createMachine(organizationId: string, dto: CreateMachineDto) {
    return this.prisma.machine.create({
      data: {
        organizationId,
        machineCode: dto.machineCode,
        name: dto.name,
        category: dto.category,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        location: dto.location,
        branchId: dto.branchId,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : undefined,
        capacityUnit: dto.capacityUnit,
        powerRating: dto.powerRating,
        purchasePrice: dto.purchasePrice ? new Prisma.Decimal(dto.purchasePrice) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
        notes: dto.notes,
      },
    });
  }

  async getMachines(organizationId: string, status?: string) {
    const where: Prisma.MachineWhereInput = { organizationId, deletedAt: null };
    if (status) where.status = status as 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'BREAKDOWN' | 'DECOMMISSIONED';
    return this.prisma.machine.findMany({
      where,
      include: { _count: { select: { maintenanceLogs: true, downtimeLogs: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getMachineById(organizationId: string, id: string) {
    const machine = await this.prisma.machine.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        maintenanceLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        spareParts: true,
        downtimeLogs: { orderBy: { startTime: 'desc' }, take: 10 },
      },
    });
    if (!machine) throw new NotFoundException('Machine not found');
    return machine;
  }

  async updateMachineStatus(organizationId: string, id: string, status: string) {
    const machine = await this.prisma.machine.findFirst({ where: { id, organizationId } });
    if (!machine) throw new NotFoundException('Machine not found');
    return this.prisma.machine.update({
      where: { id },
      data: { status: status as 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'BREAKDOWN' | 'DECOMMISSIONED' },
    });
  }

  // --- Maintenance Logs ---
  async createMaintenanceLog(organizationId: string, dto: CreateMaintenanceLogDto) {
    const partsCost = parseFloat(dto.partsCost ?? '0');
    const laborCost = parseFloat(dto.laborCost ?? '0');
    return this.prisma.maintenanceLog.create({
      data: {
        organizationId,
        machineId: dto.machineId,
        maintenanceType: dto.maintenanceType,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
        description: dto.description,
        findings: dto.findings,
        partsCost: new Prisma.Decimal(partsCost),
        laborCost: new Prisma.Decimal(laborCost),
        totalCost: new Prisma.Decimal(partsCost + laborCost),
        performedBy: dto.performedBy,
        nextScheduled: dto.nextScheduled ? new Date(dto.nextScheduled) : undefined,
      },
    });
  }

  async getMaintenanceLogs(organizationId: string, machineId?: string) {
    const where: Prisma.MaintenanceLogWhereInput = { organizationId };
    if (machineId) where.machineId = machineId;
    return this.prisma.maintenanceLog.findMany({
      where,
      include: { machine: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Spare Parts ---
  async createSpare(organizationId: string, dto: CreateSpareDto) {
    return this.prisma.machineSpare.create({
      data: {
        organizationId,
        machineId: dto.machineId,
        partName: dto.partName,
        partNumber: dto.partNumber,
        quantity: dto.quantity ?? 0,
        minStock: dto.minStock ?? 0,
        unitCost: dto.unitCost ? new Prisma.Decimal(dto.unitCost) : new Prisma.Decimal(0),
        supplier: dto.supplier,
      },
    });
  }

  async getSpares(organizationId: string, machineId?: string) {
    const where: Prisma.MachineSpareWhereInput = { organizationId };
    if (machineId) where.machineId = machineId;
    return this.prisma.machineSpare.findMany({ where, include: { machine: true } });
  }

  async getLowStockSpares(organizationId: string) {
    const spares = await this.prisma.machineSpare.findMany({
      where: { organizationId },
      include: { machine: true },
    });
    return spares.filter((s) => s.quantity <= s.minStock);
  }

  // --- Downtime ---
  async createDowntime(organizationId: string, dto: CreateDowntimeDto) {
    return this.prisma.downtimeLog.create({
      data: {
        organizationId,
        machineId: dto.machineId,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        reason: dto.reason,
        category: dto.category,
        productionLoss: dto.productionLoss ? new Prisma.Decimal(dto.productionLoss) : undefined,
        resolved: dto.resolved ?? false,
        resolution: dto.resolution,
      },
    });
  }

  async resolveDowntime(organizationId: string, id: string, resolution: string) {
    const log = await this.prisma.downtimeLog.findFirst({ where: { id, organizationId } });
    if (!log) throw new NotFoundException('Downtime log not found');
    return this.prisma.downtimeLog.update({
      where: { id },
      data: { resolved: true, resolution, endTime: new Date() },
    });
  }

  // --- OEE Calculation ---
  async getOEE(organizationId: string, machineId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const downtimeLogs = await this.prisma.downtimeLog.findMany({
      where: { organizationId, machineId, startTime: { gte: start }, endTime: { lte: end } },
    });

    let totalDowntimeHours = 0;
    for (const log of downtimeLogs) {
      if (log.endTime) {
        totalDowntimeHours += (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60 * 60);
      }
    }

    const availability = totalHours > 0 ? ((totalHours - totalDowntimeHours) / totalHours) * 100 : 0;

    const maintenanceCosts = await this.prisma.maintenanceLog.aggregate({
      where: { organizationId, machineId, createdAt: { gte: start, lte: end } },
      _sum: { totalCost: true },
      _count: true,
    });

    return {
      machineId,
      period: { start: startDate, end: endDate },
      totalHours,
      downtimeHours: totalDowntimeHours,
      availability: Math.round(availability * 100) / 100,
      maintenanceCount: maintenanceCosts._count,
      maintenanceCost: Number(maintenanceCosts._sum.totalCost ?? 0),
      downtimeIncidents: downtimeLogs.length,
    };
  }
}
