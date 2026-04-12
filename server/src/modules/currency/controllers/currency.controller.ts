import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { CurrencyService } from '../services/currency.service';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { SyncRatesDto } from '../dto/sync-rates.dto';
import { CurrencyHistoryQueryDto } from '../dto/currency-history-query.dto';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  getRates(@Query('baseCurrency') baseCurrency?: Currency) {
    return this.currencyService.getRates(baseCurrency ?? Currency.INR);
  }

  @Get('history')
  listHistory(@Query() query: CurrencyHistoryQueryDto) {
    return this.currencyService.listConversionHistory(query);
  }

  @Post('convert')
  convert(@Body() dto: ConvertCurrencyDto) {
    return this.currencyService.convert(dto.amount, dto.from, dto.to, dto.context);
  }

  @Post('sync')
  syncRates(@Body() dto: SyncRatesDto) {
    return this.currencyService.requestRateSync(dto.source ?? 'manual');
  }
}
