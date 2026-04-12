import { Module } from '@nestjs/common';
import { WalletsController } from './controllers/wallets.controller';
import { WalletsService } from './services/wallets.service';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
