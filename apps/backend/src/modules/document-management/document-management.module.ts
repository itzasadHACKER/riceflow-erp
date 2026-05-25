import { Module } from '@nestjs/common';
import { DocumentManagementService } from './document-management.service';
import { DocumentManagementController } from './document-management.controller';

@Module({
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
