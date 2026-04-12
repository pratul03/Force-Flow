import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GeneratePayrollDto } from '../dto/generate-payroll.dto';
import { MarkInvoicePaidDto } from '../dto/mark-invoice-paid.dto';
import { PayrollQueryDto } from '../dto/payroll-query.dto';
import { PayrollService } from '../services/payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('preview/:userId')
  preview(
    @Param('userId') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const current = new Date();
    return this.payrollService.previewUserPayroll(
      userId,
      Number(month ?? current.getUTCMonth() + 1),
      Number(year ?? current.getUTCFullYear()),
    );
  }

  @Post('generate')
  generate(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.generatePayrollCycle(dto);
  }

  @Get('invoices')
  invoices(@Query() query: PayrollQueryDto) {
    return this.payrollService.listInvoices(query);
  }

  @Get('invoices/:id')
  invoice(@Param('id') id: string) {
    return this.payrollService.getInvoice(id);
  }

  @Get('invoices/:id/render')
  renderInvoice(@Param('id') id: string) {
    return this.payrollService.getInvoiceRenderedDocument(id);
  }

  @Get('invoices/:id/pdf')
  async invoicePdf(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.payrollService.downloadInvoicePdf(id);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.fileName}"`,
    );

    response.send(pdf.buffer);
  }

  @Patch('invoices/:id/paid')
  markPaid(@Param('id') id: string, @Body() dto: MarkInvoicePaidDto) {
    return this.payrollService.markInvoicePaid(id, dto);
  }
}
