import { Module } from '@nestjs/common';
import { MailboxController } from './controllers/mailbox.controller';
import { MailboxService } from './services/mailbox.service';
import { TokenCipherService } from './services/token-cipher.service';
import { GmailProviderClient } from './services/provider-clients/gmail-provider.client';
import { OutlookProviderClient } from './services/provider-clients/outlook-provider.client';

@Module({
  controllers: [MailboxController],
  providers: [
    MailboxService,
    TokenCipherService,
    GmailProviderClient,
    OutlookProviderClient,
  ],
  exports: [MailboxService],
})
export class MailboxModule {}
