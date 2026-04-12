import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { WalletsService } from '../services/wallets.service';
import { CreateWalletTransactionDto } from '../dto/create-wallet-transaction.dto';
import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('user/:userId')
  getUserWallet(@Param('userId') userId: string) {
    return this.walletsService.getUserWallet(userId);
  }

  @Post('user/:userId/bootstrap')
  bootstrapWallet(
    @Param('userId') userId: string,
    @Query('currency') currency?: Currency,
  ) {
    return this.walletsService.bootstrapWallet(userId, currency);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateWalletTransactionDto) {
    return this.walletsService.createTransaction(dto);
  }

  @Post('withdrawals')
  requestWithdrawal(@Body() dto: RequestWithdrawalDto) {
    return this.walletsService.requestWithdrawal(dto);
  }

  @Post('withdrawals/:transactionId/retry')
  retryWithdrawal(@Param('transactionId') transactionId: string) {
    return this.walletsService.retryWithdrawal(transactionId);
  }

  @Get('transactions')
  listTransactions(@Query('userId') userId?: string) {
    return this.walletsService.listTransactions(userId);
  }
}
