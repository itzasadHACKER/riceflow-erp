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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QualityControlService } from './quality-control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import {
  CreateQualityInspectionDto,
  UpdateInspectionStatusDto,
  QualityFilterDto,
} from './dto/quality.dto';

@ApiTags('quality-control')
@Controller('quality-control')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QualityControlController {
  constructor(private readonly qualityControlService: QualityControlService) {}

  @Post('inspections')
  @ApiOperation({ summary: 'Create quality inspection' })
  async createInspection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQualityInspectionDto,
  ) {
    const result = await this.qualityControlService.createInspection(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'List quality inspections' })
  async getInspections(
    @CurrentUser() user: JwtPayload,
    @Query() filter: QualityFilterDto,
  ) {
    const result = await this.qualityControlService.getInspections(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Get('inspections/summary')
  @ApiOperation({ summary: 'Quality summary report' })
  async getQualitySummary(@CurrentUser() user: JwtPayload) {
    const result = await this.qualityControlService.getQualitySummary(
      user.organizationId,
    );
    return createResponse(result);
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get inspection by ID' })
  async getInspectionById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.qualityControlService.getInspectionById(
      user.organizationId,
      id,
    );
    return createResponse(result);
  }

  @Patch('inspections/:id/status')
  @ApiOperation({ summary: 'Update inspection status/grade' })
  async updateInspectionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionStatusDto,
  ) {
    const result = await this.qualityControlService.updateInspectionStatus(
      user.organizationId,
      id,
      dto,
      user.sub,
    );
    return createResponse(result);
  }
}
