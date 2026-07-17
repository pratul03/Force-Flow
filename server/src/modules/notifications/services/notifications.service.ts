import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { NotificationStatus, Prisma, QueueJob } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { renderTemplate } from '../../../common/templates/template-renderer';
import { QueueService } from '../../queue/services/queue.service';
import { MailService } from './mail.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationLogQueryDto } from '../dto/notification-log-query.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('notification.send', async (job: QueueJob) => {
      await this.processNotificationJob(job);
    });
  }

  async send(dto: CreateNotificationDto, organizationId: string) {
    if (dto.userId) {
      await this.assertUserInOrganization(dto.userId, organizationId);
    }

    return this.queueService.enqueue({
      type: 'notification.send',
      payload: { ...dto, organizationId },
      maxAttempts: 5,
    });
  }

  async listLogs(query: NotificationLogQueryDto, organizationId: string) {
    if (query.userId) {
      await this.assertUserInOrganization(query.userId, organizationId);
    }

    return this.prisma.notificationLog.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.status ? { status: query.status } : {}),
        user: {
          organizationId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
    });
  }

  private async processNotificationJob(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;

    const userId = typeof payload.userId === 'string' ? payload.userId : null;
    const templateKey =
      typeof payload.templateKey === 'string' && payload.templateKey.length > 0
        ? payload.templateKey
        : null;
    const explicitOrganizationId =
      typeof payload.organizationId === 'string' && payload.organizationId.length > 0
        ? payload.organizationId
        : null;
    const templateData =
      payload.templateData && typeof payload.templateData === 'object'
        ? (payload.templateData as Record<string, unknown>)
        : {};
    const channel =
      typeof payload.channel === 'string' && payload.channel.length > 0
        ? payload.channel
        : 'email';
    let title =
      typeof payload.title === 'string' && payload.title.length > 0
        ? payload.title
        : 'Notification';
    let message =
      typeof payload.message === 'string' && payload.message.length > 0
        ? payload.message
        : 'No message body provided';
    const locale = typeof payload.locale === 'string' ? payload.locale : null;
    const metadata =
      payload.metadata && typeof payload.metadata === 'object'
        ? (payload.metadata as Prisma.InputJsonValue)
        : undefined;

    if (channel === 'email') {
      let emailAddress: string | undefined;

      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        emailAddress = user?.email;
      }

      if (templateKey) {
        const organizationId = explicitOrganizationId ?? (await this.resolveOrganizationId(userId));

        if (organizationId) {
          const emailTemplate = await this.prisma.emailTemplate.findUnique({
            where: {
              organizationId_key: {
                organizationId,
                key: templateKey,
              },
            },
            select: {
              subject: true,
              body: true,
              isActive: true,
            },
          });

          if (emailTemplate?.isActive) {
            title = renderTemplate(emailTemplate.subject, templateData);
            message = renderTemplate(emailTemplate.body, templateData);
          }
        }
      }

      if (emailAddress) {
        await this.mailService.sendMail(emailAddress, title, message);
      }
    }

    try {
      await this.prisma.notificationLog.create({
        data: {
          userId,
          channel,
          title,
          message,
          locale,
          metadata,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.notificationLog.create({
        data: {
          userId,
          channel,
          title,
          message,
          locale,
          metadata,
          status: NotificationStatus.FAILED,
          error: messageText,
        },
      });

      throw error;
    }
  }

  private async resolveOrganizationId(userId: string | null) {
    if (!userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    return user?.organizationId ?? null;
  }

  private async assertUserInOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in your organization');
    }
  }
}
