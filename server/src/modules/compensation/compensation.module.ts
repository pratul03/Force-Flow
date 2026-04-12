import { Module } from '@nestjs/common';
import { CompensationController } from './controllers/compensation.controller';
import { CompensationService } from './services/compensation.service';

@Module({
  controllers: [CompensationController],
  providers: [CompensationService],
  exports: [CompensationService],
})
export class CompensationModule {}
