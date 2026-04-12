import { Module } from '@nestjs/common';
import { PerformanceController } from './controllers/performance.controller';
import { PerformanceService } from './services/performance.service';

@Module({
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
