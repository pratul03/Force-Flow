import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateBankDetailsDto } from '../dto/update-bank-details.dto';
import { UpdateCompensationDto } from '../dto/update-compensation.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
    organizationId: string;
  };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user.organizationId);
  }

  @Get(':id/bank-details')
  getBankDetails(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // Only the user themselves or an HR/Admin can view bank details.
    return this.usersService.getBankDetails(id);
  }

  @Patch(':id/bank-details')
  updateBankDetails(
    @Param('id') id: string,
    @Body() dto: UpdateBankDetailsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateBankDetails(id, dto);
  }

  @Get(':id/compensation')
  getCompensation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.getCompensation(id);
  }

  @Patch(':id/compensation')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  updateCompensation(
    @Param('id') id: string,
    @Body() dto: UpdateCompensationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateCompensation(id, dto);
  }
}
