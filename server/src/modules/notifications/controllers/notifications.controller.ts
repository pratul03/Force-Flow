import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationLogQueryDto } from '../dto/notification-log-query.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  send(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Get('logs')
  logs(@Query() query: NotificationLogQueryDto) {
    return this.notificationsService.listLogs(query);
  }
}
