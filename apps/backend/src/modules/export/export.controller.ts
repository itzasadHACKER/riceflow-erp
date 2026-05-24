import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { ExportRequestDto } from './dto/export.dto';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @ApiOperation({ summary: 'Export data as CSV/Excel/PDF' })
  async exportData(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ExportRequestDto,
  ) {
    const result = await this.exportService.exportData(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get('print-templates')
  @ApiOperation({ summary: 'Get print templates' })
  @ApiQuery({ name: 'entityType', required: false })
  async getPrintTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType?: string,
  ) {
    const result = await this.exportService.getPrintTemplates(
      user.organizationId,
      entityType,
    );
    return createResponse(result);
  }

  @Post('print-templates')
  @ApiOperation({ summary: 'Create print template' })
  async createPrintTemplate(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name: string;
      entityType: string;
      template: string;
      isDefault?: boolean;
      paperSize?: string;
      orientation?: string;
      headerHtml?: string;
      footerHtml?: string;
    },
  ) {
    const result = await this.exportService.createPrintTemplate(
      user.organizationId,
      body,
    );
    return createResponse(result);
  }

  @Get('numbering-series')
  @ApiOperation({ summary: 'Get numbering series' })
  async getNumberingSeries(@CurrentUser() user: JwtPayload) {
    const result = await this.exportService.getNumberingSeries(
      user.organizationId,
    );
    return createResponse(result);
  }

  @Post('numbering-series')
  @ApiOperation({ summary: 'Update numbering series' })
  async updateNumberingSeries(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      entityType: string;
      prefix?: string;
      padLength?: number;
      suffix?: string;
    },
  ) {
    const result = await this.exportService.updateNumberingSeries(
      user.organizationId,
      body.entityType,
      body,
    );
    return createResponse(result);
  }
}
