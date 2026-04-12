import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { CompleteMailOAuthDto } from '../dto/complete-mail-oauth.dto';
import { SendMailDto } from '../dto/send-mail.dto';
import { MailboxService } from '../services/mailbox.service';

type RequestUserPayload = {
  sub: string;
};

@Controller('mailbox')
@UseGuards(JwtAuthGuard)
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  @Get('providers/status')
  getProviderStatuses(
    @Req() req: { user?: RequestUserPayload },
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.getProviderStatuses(userId);
  }

  @Post('providers/:provider/connect')
  startOAuth(
    @Req() req: { user?: RequestUserPayload },
    @Param('provider') provider: string,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.startOAuth(userId, this.parseProvider(provider));
  }

  @Post('providers/oauth/complete')
  completeOAuth(
    @Req() req: { user?: RequestUserPayload },
    @Body() dto: CompleteMailOAuthDto,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.completeOAuth(userId, dto);
  }

  @Delete('providers/:provider')
  disconnectProvider(
    @Req() req: { user?: RequestUserPayload },
    @Param('provider') provider: string,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.disconnectProvider(userId, this.parseProvider(provider));
  }

  @Post('providers/:provider/sync')
  syncMessages(
    @Req() req: { user?: RequestUserPayload },
    @Param('provider') provider: string,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.syncMessages(userId, this.parseProvider(provider));
  }

  @Post('providers/:provider/messages/:messageId/read')
  markAsRead(
    @Req() req: { user?: RequestUserPayload },
    @Param('provider') provider: string,
    @Param('messageId') messageId: string,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.markAsRead(userId, this.parseProvider(provider), messageId);
  }

  @Post('providers/:provider/send')
  sendEmail(
    @Req() req: { user?: RequestUserPayload },
    @Param('provider') provider: string,
    @Body() dto: SendMailDto,
  ) {
    const userId = this.requireUserId(req);
    return this.mailboxService.sendEmail(userId, this.parseProvider(provider), dto);
  }

  private parseProvider(providerRaw: string): 'gmail' | 'outlook' {
    if (providerRaw === 'gmail' || providerRaw === 'outlook') {
      return providerRaw;
    }

    throw new BadRequestException('Invalid mailbox provider');
  }

  private requireUserId(req: { user?: RequestUserPayload }): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    return userId;
  }
}
