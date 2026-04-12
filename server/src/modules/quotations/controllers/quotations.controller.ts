import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { DownloadQuotationPdfQueryDto } from '../dto/download-quotation-pdf-query.dto';
import { ManualQuotationActionDto } from '../dto/manual-quotation-action.dto';
import { PublicQuotationResponseDto } from '../dto/public-quotation-response.dto';
import { QuotationsQueryDto } from '../dto/quotations-query.dto';
import { SendQuotationDto } from '../dto/send-quotation.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { QuotationsService } from '../services/quotations.service';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get('public/:token')
  publicDetails(@Param('token') token: string) {
    return this.quotationsService.publicDetails(token);
  }

  @Post('public/:token/approve')
  publicApprove(
    @Param('token') token: string,
    @Body() dto: PublicQuotationResponseDto,
  ) {
    return this.quotationsService.publicApprove(token, dto);
  }

  @Post('public/:token/reject')
  publicReject(
    @Param('token') token: string,
    @Body() dto: PublicQuotationResponseDto,
  ) {
    return this.quotationsService.publicReject(token, dto);
  }

  @Get('public/:token/pdf')
  async publicPdf(@Param('token') token: string, @Res() response: Response) {
    const pdf = await this.quotationsService.downloadPdfForPublicToken(token);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${pdf.fileName}"`,
    );

    response.send(pdf.buffer);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: QuotationsQueryDto) {
    return this.quotationsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  remove(@Param('id') id: string, @Query('actorUserId') actorUserId: string) {
    return this.quotationsService.remove(id, actorUserId);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  send(@Param('id') id: string, @Body() dto: SendQuotationDto) {
    return this.quotationsService.send(id, dto);
  }

  @Post(':id/manual-approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  manualApprove(@Param('id') id: string, @Body() dto: ManualQuotationActionDto) {
    return this.quotationsService.manualApprove(id, dto);
  }

  @Post(':id/manual-reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  manualReject(@Param('id') id: string, @Body() dto: ManualQuotationActionDto) {
    return this.quotationsService.manualReject(id, dto);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async adminPdf(
    @Param('id') id: string,
    @Query() query: DownloadQuotationPdfQueryDto,
    @Res() response: Response,
  ) {
    const pdf = await this.quotationsService.downloadPdfForAdmin(
      id,
      query.actorUserId,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.fileName}"`,
    );

    response.send(pdf.buffer);
  }
}
