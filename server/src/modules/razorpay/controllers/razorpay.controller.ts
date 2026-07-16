import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RazorpayService } from '../services/razorpay.service';

type AuthenticatedRequest = {
  user: {
    organizationId: string;
  };
};

@Controller('razorpay')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('payout')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  payout(@Body() payload: Record<string, unknown>, @Req() req: AuthenticatedRequest) {
    return this.razorpayService.createPayout(payload, req.user.organizationId);
  }
}
