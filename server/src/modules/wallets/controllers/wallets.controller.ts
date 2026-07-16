import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Currency } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { WalletsService } from '../services/wallets.service';
import { CreateWalletTransactionDto } from '../dto/create-wallet-transaction.dto';
import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
    organizationId: string;
    role: string;
  };
};

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('user/:userId')
  getUserWallet(@Param('userId') userId: string, @Req() req: AuthenticatedRequest) {
    return this.walletsService.getUserWallet(userId, req.user);
  }

  @Post('user/:userId/bootstrap')
  bootstrapWallet(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
    @Query('currency') currency?: Currency,
  ) {
    return this.walletsService.bootstrapWallet(userId, currency, req.user);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateWalletTransactionDto, @Req() req: AuthenticatedRequest) {
    return this.walletsService.createTransaction(dto, req.user);
  }

  @Post('withdrawals')
  requestWithdrawal(@Body() dto: RequestWithdrawalDto, @Req() req: AuthenticatedRequest) {
    return this.walletsService.requestWithdrawal(dto, req.user);
  }

  @Post('withdrawals/:transactionId/retry')
  retryWithdrawal(@Param('transactionId') transactionId: string, @Req() req: AuthenticatedRequest) {
    return this.walletsService.retryWithdrawal(transactionId, req.user);
  }

  @Get('transactions')
  listTransactions(@Query('userId') userId: string | undefined, @Req() req: AuthenticatedRequest) {
    return this.walletsService.listTransactions(userId, req.user);
  }
}
