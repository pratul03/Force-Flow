import { Module } from '@nestjs/common';
import { TicketsController } from './controllers/tickets.controller';
import { TicketsService } from './services/tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
