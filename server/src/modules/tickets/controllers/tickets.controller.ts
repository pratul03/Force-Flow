import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { UpdateTicketDetailsDto } from '../dto/update-ticket-details.dto';
import { ReorderTicketsDto } from '../dto/reorder-tickets.dto';
import { SwapTicketsDto } from '../dto/swap-tickets.dto';
import { TicketsService } from '../services/tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(@Query() query: TicketsQueryDto, @Req() req: { user: { organizationId: string } }) {
    return this.ticketsService.findAll({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Patch('reorder')
  reorderTickets(
    @Body() dto: ReorderTicketsDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.ticketsService.reorderTickets(req.user.organizationId, dto.updates);
  }

  @Patch('swap')
  swapTickets(
    @Body() dto: SwapTicketsDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.ticketsService.swapTickets(req.user.organizationId, dto.ticket1Id, dto.ticket2Id);
  }

  @Get(':id/comments')
  listComments(
    @Param('id') id: string,
    @Query() query: TicketActorQueryDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.ticketsService.listComments(id, {
      ...query,
      actorUserId: req.user.sub,
    });
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateTicketCommentDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.ticketsService.addComment(id, {
      ...dto,
      actorUserId: req.user.sub,
    });
  }

  @Get(':id/history')
  statusHistory(
    @Param('id') id: string,
    @Query() query: TicketActorQueryDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.ticketsService.statusHistory(id, {
      ...query,
      actorUserId: req.user.sub,
    });
  }

  @Get('by-slug/:slug')
  findOneBySlug(@Param('slug') slug: string, @Req() req: { user: { organizationId: string } }) {
    return this.ticketsService.findOneBySlug(slug, req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.ticketsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req: { user: { sub: string; organizationId: string } }) {
    return this.ticketsService.create({
      ...dto,
      organizationId: req.user.organizationId,
      requesterId: req.user.sub,
    });
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @Req() req: { user: { sub: string } }) {
    return this.ticketsService.assign(id, {
      ...dto,
      actorUserId: req.user.sub,
    });
  }

  @Patch(':id')
  updateDetails(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDetailsDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.ticketsService.updateDetails(id, {
      ...dto,
      actorUserId: req.user.sub,
    });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.ticketsService.updateStatus(id, {
      ...dto,
      actorUserId: req.user.sub,
    });
  }
}
