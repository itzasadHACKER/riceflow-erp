import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AdminEnhancedService } from './admin-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin-enhanced')
@UseGuards(JwtAuthGuard)
export class AdminEnhancedController {
  constructor(private svc: AdminEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }

  // UDF
  @Post('udfs')
  createUdf(@Req() req: any, @Body() dto: any) { return this.svc.createUdf(this.orgId(req), dto); }
  @Get('udfs')
  getUdfs(@Req() req: any, @Query('entityType') entityType?: string) { return this.svc.findUdfs(this.orgId(req), entityType); }
  @Post('udf-values')
  setUdfValue(@Req() req: any, @Body() dto: any) { return this.svc.setUdfValue(this.orgId(req), dto); }
  @Get('udf-values/:entityId')
  getUdfValues(@Req() req: any, @Param('entityId') entityId: string) { return this.svc.getUdfValues(this.orgId(req), entityId); }

  // Print Layouts
  @Post('print-layouts')
  createPrintLayout(@Req() req: any, @Body() dto: any) { return this.svc.createPrintLayout(this.orgId(req), dto); }
  @Get('print-layouts')
  getPrintLayouts(@Req() req: any, @Query('documentType') documentType?: string) { return this.svc.findPrintLayouts(this.orgId(req), documentType); }
  @Patch('print-layouts/:id')
  updatePrintLayout(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updatePrintLayout(this.orgId(req), id, dto); }

  // Form Customization
  @Post('form-layouts')
  saveFormLayout(@Req() req: any, @Body() dto: any) { return this.svc.saveFormLayout(this.orgId(req), dto); }
  @Get('form-layouts')
  getFormLayouts(@Req() req: any) { return this.svc.findFormCustomizations(this.orgId(req)); }
  @Get('form-layouts/:formName')
  getFormLayout(@Req() req: any, @Param('formName') formName: string, @Query('roleId') roleId?: string) {
    return this.svc.getFormLayout(this.orgId(req), formName, roleId);
  }

  // Data Ownership
  @Post('data-ownership')
  setDataOwnership(@Req() req: any, @Body() dto: any) { return this.svc.setDataOwnership(this.orgId(req), dto); }
  @Get('data-ownership')
  getDataOwnership(@Req() req: any) { return this.svc.findDataOwnershipRules(this.orgId(req)); }

  // Drag & Relate
  @Get('drag-relate')
  dragAndRelate(@Req() req: any, @Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.svc.dragAndRelate(this.orgId(req), entityType, entityId);
  }

  // Excel Export
  @Get('excel-export/:module')
  excelExport(@Req() req: any, @Param('module') module: string) { return this.svc.getExportData(this.orgId(req), module); }

  // Summary
  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getAdminEnhancedSummary(this.orgId(req)); }
}
