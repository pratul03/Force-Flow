import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { GeneratePayrollDto } from '../dto/generate-payroll.dto';
import { MarkInvoicePaidDto } from '../dto/mark-invoice-paid.dto';
import { PayrollQueryDto } from '../dto/payroll-query.dto';
import { PayrollService } from '../services/payroll.service';

type AuthenticatedRequest = {
  user: {
    organizationId: string;
  };
};

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('preview/:userId')
  preview(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const current = new Date();
    return this.payrollService.previewUserPayroll(
      userId,
      Number(month ?? current.getUTCMonth() + 1),
      Number(year ?? current.getUTCFullYear()),
      req.user.organizationId,
    );
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  generate(@Body() dto: GeneratePayrollDto, @Req() req: AuthenticatedRequest) {
    return this.payrollService.generatePayrollCycle(dto, req.user.organizationId);
  }

  @Get('invoices')
  invoices(@Query() query: PayrollQueryDto, @Req() req: AuthenticatedRequest) {
    return this.payrollService.listInvoices(query, req.user.organizationId);
  }

  @Get('invoices/:id')
  invoice(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.payrollService.getInvoice(id, req.user.organizationId);
  }

  @Get('invoices/:id/render')
  renderInvoice(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.payrollService.getInvoiceRenderedDocument(id, req.user.organizationId);
  }

  @Get('invoices/:id/pdf')
  async invoicePdf(
    @Param('id') id: string,
    @Res() response: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const pdf = await this.payrollService.downloadInvoicePdf(id, req.user.organizationId);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.fileName}"`,
    );

    response.send(pdf.buffer);
  }

  @Patch('invoices/:id/paid')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.payrollService.markInvoicePaid(id, dto, req.user.organizationId);
  }
}
