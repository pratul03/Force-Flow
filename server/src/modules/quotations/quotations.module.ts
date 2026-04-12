import { Module } from '@nestjs/common';
import { QuotationsController } from './controllers/quotations.controller';
import { QuotationsService } from './services/quotations.service';

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
