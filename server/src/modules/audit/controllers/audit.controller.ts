import { Controller, Get } from '@nestjs/common';
import { AuditService } from '../services/audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('recent-activity')
  recentActivity() {
    return this.auditService.recentActivity();
  }
}
