import { Module } from '@nestjs/common';
import { LeavesController } from './controllers/leaves.controller';
import { LeavesService } from './services/leaves.service';

@Module({
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
