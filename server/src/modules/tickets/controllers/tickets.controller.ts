import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { CreateTicketCommentDto } from '../dto/create-ticket-comment.dto';
import { TicketActorQueryDto } from '../dto/ticket-actor-query.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TicketsQueryDto } from '../dto/tickets-query.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketsService } from '../services/tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: TicketsQueryDto) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  listComments(@Param('id') id: string, @Query() query: TicketActorQueryDto) {
    return this.ticketsService.listComments(id, query);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id') id: string, @Body() dto: CreateTicketCommentDto) {
    return this.ticketsService.addComment(id, dto);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  statusHistory(@Param('id') id: string, @Query() query: TicketActorQueryDto) {
    return this.ticketsService.statusHistory(id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.ticketsService.assign(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, dto);
  }
}
