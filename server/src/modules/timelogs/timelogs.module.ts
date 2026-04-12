import { Module } from '@nestjs/common';
import { TimelogsController } from './controllers/timelogs.controller';
import { TimelogsService } from './services/timelogs.service';

@Module({
  controllers: [TimelogsController],
  providers: [TimelogsService],
  exports: [TimelogsService],
})
export class TimelogsModule {}
