import {
  Body,
  Controller,
  Delete,
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
import { CreateLeadDto } from '../dto/create-lead.dto';
import { LeadsQueryDto } from '../dto/leads-query.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadsService } from '../services/leads.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query() query: LeadsQueryDto, @Req() req: { user: { organizationId: string } }) {
    return this.leadsService.findAll({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.leadsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  create(@Body() dto: CreateLeadDto, @Req() req: { user: { sub: string; organizationId: string } }) {
    return this.leadsService.create({
      ...dto,
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.leadsService.update(id, {
      ...dto,
      actorUserId: req.user.sub,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  remove(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.leadsService.remove(id, req.user.sub);
  }
}
