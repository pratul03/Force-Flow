import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AuditService } from '../services/audit.service';

type AuthenticatedRequest = {
  user?: {
    organizationId?: string;
  };
};

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('recent-activity')
  recentActivity(@Req() req: AuthenticatedRequest) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context is missing');
    }

    return this.auditService.recentActivity(organizationId);
  }
}
