import { Controller, Get, Headers } from '@nestjs/common';
import { I18nService } from '../services/i18n.service';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('locales')
  locales() {
    return this.i18nService.getLocales();
  }

  @Get('detect')
  detect(@Headers('accept-language') acceptLanguage?: string) {
    return { locale: this.i18nService.detectLocale(acceptLanguage) };
  }
}
