import { Module } from '@nestjs/common';
import { HolidaysController } from './controllers/holidays.controller';
import { HolidaysService } from './services/holidays.service';

@Module({
  controllers: [HolidaysController],
  providers: [HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
