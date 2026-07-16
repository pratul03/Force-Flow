import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationLogQueryDto } from '../dto/notification-log-query.dto';

type AuthenticatedRequest = {
  user: {
    organizationId: string;
  };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  send(@Body() dto: CreateNotificationDto, @Req() req: AuthenticatedRequest) {
    return this.notificationsService.send(dto, req.user.organizationId);
  }

  @Get('logs')
  logs(@Query() query: NotificationLogQueryDto, @Req() req: AuthenticatedRequest) {
    return this.notificationsService.listLogs(query, req.user.organizationId);
  }
}
