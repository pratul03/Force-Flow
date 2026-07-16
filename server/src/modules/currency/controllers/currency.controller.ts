import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Currency, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { CurrencyService } from '../services/currency.service';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { SyncRatesDto } from '../dto/sync-rates.dto';
import { CurrencyHistoryQueryDto } from '../dto/currency-history-query.dto';

@Controller('currency')
@UseGuards(JwtAuthGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  getRates(@Query('baseCurrency') baseCurrency?: Currency) {
    return this.currencyService.getRates(baseCurrency ?? Currency.INR);
  }

  @Get('history')
  listHistory(
    @Query() query: CurrencyHistoryQueryDto,
    @Req() req: { user: { sub: string; organizationId: string; role: Role } },
  ) {
    return this.currencyService.listConversionHistory(query, {
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
      role: req.user.role,
    });
  }

  @Post('convert')
  convert(
    @Body() dto: ConvertCurrencyDto,
    @Req() req: { user: { sub: string; organizationId: string; role: Role } },
  ) {
    return this.currencyService.convert(dto.amount, dto.from, dto.to, dto.context, {
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
      role: req.user.role,
    });
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  syncRates(
    @Body() dto: SyncRatesDto,
    @Req() req: { user: { sub: string; organizationId: string } },
  ) {
    return this.currencyService.requestRateSync(dto.source ?? 'manual', {
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
    });
  }
}
