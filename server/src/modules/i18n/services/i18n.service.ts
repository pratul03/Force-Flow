import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nService {
  private readonly locales = ['en', 'hi', 'es', 'fr', 'zh'];

  getLocales() {
    return this.locales;
  }

  detectLocale(header?: string) {
    const source = (header ?? '').toLowerCase();
    return this.locales.find((locale) => source.includes(locale)) ?? 'en';
  }
}
