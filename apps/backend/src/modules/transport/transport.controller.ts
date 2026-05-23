import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateDriverDto,
  UpdateDriverDto,
  CreateFreightEntryDto,
} from './dto/transport.dto';

@ApiTags('transport')
@Controller('transport')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('vehicles')
  @ApiOperation({ summary: 'Create vehicle' })
  async createVehicle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVehicleDto,
  ) {
    const vehicle = await this.transportService.createVehicle(
      user.organizationId,
      dto,
    );
    return createResponse(vehicle);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles' })
  async listVehicles(@CurrentUser() user: JwtPayload) {
    const data = await this.transportService.listVehicles(user.organizationId);
    return createResponse(data);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async getVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const vehicle = await this.transportService.getVehicle(
      user.organizationId,
      id,
    );
    return createResponse(vehicle);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update vehicle' })
  async updateVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.transportService.updateVehicle(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(vehicle);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Create driver' })
  async createDriver(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDriverDto,
  ) {
    const driver = await this.transportService.createDriver(
      user.organizationId,
      dto,
    );
    return createResponse(driver);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'List drivers' })
  async listDrivers(@CurrentUser() user: JwtPayload) {
    const data = await this.transportService.listDrivers(user.organizationId);
    return createResponse(data);
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver by ID' })
  async getDriver(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const driver = await this.transportService.getDriver(
      user.organizationId,
      id,
    );
    return createResponse(driver);
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update driver' })
  async updateDriver(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    const driver = await this.transportService.updateDriver(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(driver);
  }

  @Post('freight')
  @ApiOperation({ summary: 'Create freight entry' })
  async createFreightEntry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFreightEntryDto,
  ) {
    const entry = await this.transportService.createFreightEntry(
      user.organizationId,
      dto,
    );
    return createResponse(entry);
  }

  @Get('freight')
  @ApiOperation({ summary: 'List freight entries' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async listFreightEntries(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.transportService.listFreightEntries(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      vehicleId,
      fromDate,
      toDate,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transport summary' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getTransportSummary(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const summary = await this.transportService.getTransportSummary(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(summary);
  }
}
