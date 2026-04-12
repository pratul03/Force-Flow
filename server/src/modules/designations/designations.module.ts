import { Module } from '@nestjs/common';
import { DesignationsController } from './controllers/designations.controller';
import { DesignationsService } from './services/designations.service';

@Module({
  controllers: [DesignationsController],
  providers: [DesignationsService],
  exports: [DesignationsService],
})
export class DesignationsModule {}
