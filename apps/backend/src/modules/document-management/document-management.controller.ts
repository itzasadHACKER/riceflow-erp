import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { DocumentManagementService } from './document-management.service';
import { CreateDocumentDto, CreateDocumentVersionDto, CreateContractDto } from './dto/document.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Document Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentManagementController {
  constructor(private readonly docService: DocumentManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create document' })
  async createDocument(@CurrentUser() user: JwtPayload, @Body() dto: CreateDocumentDto) {
    const result = await this.docService.createDocument(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async getDocuments(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    const result = await this.docService.getDocuments(user.organizationId, entityType, entityId);
    return createResponse(result);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents' })
  async searchDocuments(@CurrentUser() user: JwtPayload, @Query('q') query: string) {
    const result = await this.docService.searchDocuments(user.organizationId, query);
    return createResponse(result);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring documents' })
  async getExpiringDocuments(@CurrentUser() user: JwtPayload, @Query('days') days?: string) {
    const result = await this.docService.getExpiringDocuments(user.organizationId, parseInt(days ?? '30', 10));
    return createResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocumentById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.docService.getDocumentById(user.organizationId, id);
    return createResponse(result);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Add document version' })
  async addVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
  ) {
    const result = await this.docService.addVersion(user.organizationId, id, dto, user.sub);
    return createResponse(result);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive document' })
  async archiveDocument(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.docService.archiveDocument(user.organizationId, id);
    return createResponse(result);
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Create contract' })
  async createContract(@CurrentUser() user: JwtPayload, @Body() dto: CreateContractDto) {
    const result = await this.docService.createContract(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('contracts/list')
  @ApiOperation({ summary: 'List contracts' })
  async getContracts(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const result = await this.docService.getContracts(user.organizationId, status);
    return createResponse(result);
  }

  @Get('contracts/expiring')
  @ApiOperation({ summary: 'Get expiring contracts' })
  async getExpiringContracts(@CurrentUser() user: JwtPayload, @Query('days') days?: string) {
    const result = await this.docService.getExpiringContracts(user.organizationId, parseInt(days ?? '30', 10));
    return createResponse(result);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get contract by ID' })
  async getContractById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.docService.getContractById(user.organizationId, id);
    return createResponse(result);
  }
}
