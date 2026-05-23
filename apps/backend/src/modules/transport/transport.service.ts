import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateDriverDto,
  UpdateDriverDto,
  CreateFreightEntryDto,
} from './dto/transport.dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== VEHICLES =====

  async createVehicle(organizationId: string, dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: {
        organizationId_vehicleNumber: {
          organizationId,
          vehicleNumber: dto.vehicleNumber,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        `Vehicle ${dto.vehicleNumber} already exists`,
      );

    return this.prisma.vehicle.create({
      data: {
        organizationId,
        vehicleNumber: dto.vehicleNumber,
        vehicleType: dto.vehicleType ?? 'TRUCK',
        capacity: dto.capacity,
        capacityUnit: dto.capacityUnit ?? 'TON',
        ownerName: dto.ownerName,
        ownerPhone: dto.ownerPhone,
        isOwn: dto.isOwn ?? false,
      },
    });
  }

  async listVehicles(organizationId: string) {
    return this.prisma.vehicle.findMany({
      where: { organizationId, isActive: true },
      include: { _count: { select: { freightEntries: true } } },
      orderBy: { vehicleNumber: 'asc' },
    });
  }

  async getVehicle(organizationId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, organizationId },
      include: {
        freightEntries: { orderBy: { date: 'desc' }, take: 10 },
        _count: { select: { freightEntries: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateVehicle(
    organizationId: string,
    id: string,
    dto: UpdateVehicleDto,
  ) {
    await this.getVehicle(organizationId, id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  // ===== DRIVERS =====

  async createDriver(organizationId: string, dto: CreateDriverDto) {
    return this.prisma.driver.create({
      data: {
        organizationId,
        name: dto.name,
        phone: dto.phone,
        licenseNumber: dto.licenseNumber,
        cnic: dto.cnic,
      },
    });
  }

  async listDrivers(organizationId: string) {
    return this.prisma.driver.findMany({
      where: { organizationId, isActive: true },
      include: { _count: { select: { freightEntries: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getDriver(organizationId: string, id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, organizationId },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async updateDriver(organizationId: string, id: string, dto: UpdateDriverDto) {
    await this.getDriver(organizationId, id);
    return this.prisma.driver.update({ where: { id }, data: dto });
  }

  // ===== FREIGHT ENTRIES =====

  async createFreightEntry(organizationId: string, dto: CreateFreightEntryDto) {
    const totalAmount =
      dto.freightAmount +
      (dto.loadingCharges ?? 0) +
      (dto.unloadingCharges ?? 0);

    return this.prisma.freightEntry.create({
      data: {
        organizationId,
        date: new Date(dto.date),
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        distance: dto.distance,
        freightAmount: dto.freightAmount,
        loadingCharges: dto.loadingCharges ?? 0,
        unloadingCharges: dto.unloadingCharges ?? 0,
        totalAmount,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
      },
      include: { vehicle: true, driver: true },
    });
  }

  async listFreightEntries(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    vehicleId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: Prisma.FreightEntryWhereInput = {
      organizationId,
      ...(vehicleId ? { vehicleId } : {}),
    };

    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.freightEntry.findMany({
        where,
        include: { vehicle: true, driver: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.freightEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== TRANSPORT SUMMARY =====

  async getTransportSummary(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const entries = await this.prisma.freightEntry.findMany({
      where: {
        organizationId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: { vehicle: true },
    });

    let totalFreight = 0;
    const totalTrips = entries.length;
    const byVehicle: Record<
      string,
      { vehicleNumber: string; trips: number; totalAmount: number }
    > = {};

    for (const entry of entries) {
      totalFreight += Number(entry.totalAmount);

      const vKey = entry.vehicleId ?? 'external';
      if (!byVehicle[vKey]) {
        byVehicle[vKey] = {
          vehicleNumber: entry.vehicle?.vehicleNumber ?? 'External',
          trips: 0,
          totalAmount: 0,
        };
      }
      byVehicle[vKey].trips++;
      byVehicle[vKey].totalAmount += Number(entry.totalAmount);
    }

    return {
      period: { fromDate, toDate },
      totalTrips,
      totalFreight,
      averageFreightPerTrip: totalTrips > 0 ? totalFreight / totalTrips : 0,
      byVehicle: Object.values(byVehicle),
    };
  }
}
