import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { QueueModule } from './modules/queue/queue.module';
import { TimelogsModule } from './modules/timelogs/timelogs.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { InvoiceTemplatesModule } from './modules/invoice-templates/invoice-templates.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { AuthModule } from './modules/auth/auth.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { AssetsModule } from './modules/assets/assets.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { RazorpayModule } from './modules/razorpay/razorpay.module';
import { AuditModule } from './modules/audit/audit.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { LeadsModule } from './modules/leads/leads.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { MailboxModule } from './modules/mailbox/mailbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ...(String(process.env.SCHEDULER_DISABLED ?? 'false').toLowerCase() === 'true'
      ? []
      : [ScheduleModule.forRoot()]),
    PrismaModule,
    HealthModule,
    OrganizationsModule,
    UsersModule,
    QueueModule,
    AuthModule,
    DepartmentsModule,
    DesignationsModule,
    EmailTemplatesModule,
    InvoiceTemplatesModule,
    LocationsModule,
    ShiftsModule,
    AttendanceModule,
    CurrencyModule,
    NotificationsModule,
    ReportsModule,
    SchedulerModule,
    CompensationModule,
    HolidaysModule,
    PayrollModule,
    PerformanceModule,
    AssetsModule,
    RecruitmentModule,
    I18nModule,
    RazorpayModule,
    AuditModule,
    UploadsModule,
    TicketsModule,
    LeadsModule,
    QuotationsModule,
    SubscriptionsModule,
    MailboxModule,
    TimelogsModule,
    LeavesModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
