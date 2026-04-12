import { Module } from '@nestjs/common';
import { InvoiceTemplatesController } from './controllers/invoice-templates.controller';
import { InvoiceTemplatesService } from './services/invoice-templates.service';

@Module({
  controllers: [InvoiceTemplatesController],
  providers: [InvoiceTemplatesService],
  exports: [InvoiceTemplatesService],
})
export class InvoiceTemplatesModule {}
