import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { DataImportService } from './data-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import {
  DataImportDto,
  ImportFilterDto,
  ImportTypeEnum,
} from './dto/import.dto';

@ApiTags('data-import')
@Controller('data-import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post()
  @ApiOperation({ summary: 'Import data from JSON rows' })
  async importData(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DataImportDto,
  ) {
    const result = await this.dataImportService.importData(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get import logs' })
  async getImportLogs(
    @CurrentUser() user: JwtPayload,
    @Query() filter: ImportFilterDto,
  ) {
    const result = await this.dataImportService.getImportLogs(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Get('template')
  @ApiOperation({ summary: 'Get import template columns' })
  @ApiQuery({ name: 'importType', enum: ImportTypeEnum })
  getImportTemplate(@Query('importType') importType: ImportTypeEnum) {
    const result = this.dataImportService.getImportTemplate(importType);
    return createResponse(result);
  }
}
