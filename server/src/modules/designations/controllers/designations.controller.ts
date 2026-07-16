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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { DesignationsService } from '../services/designations.service';
import { CreateDesignationDto } from '../dto/create-designation.dto';
import {
  DeleteDesignationResponseDto,
  DesignationResponseDto,
} from '../dto/designation-response.dto';
import { UpdateDesignationDto } from '../dto/update-designation.dto';

const designationBodyExample = {
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  name: 'Senior Backend Engineer',
  code: 'SBE-3',
};

const designationResponseExample = {
  id: 'cm9z9u0g30000r4v0h8x8a7nd',
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  name: 'Senior Backend Engineer',
  code: 'SBE-3',
  createdAt: '2026-04-10T09:30:00.000Z',
  updatedAt: '2026-04-10T09:30:00.000Z',
};

@ApiTags('Designations')
@Controller('designations')
@UseGuards(JwtAuthGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create a designation' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    type: CreateDesignationDto,
    examples: {
      createDesignation: {
        summary: 'Create designation payload',
        value: designationBodyExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Designation created successfully',
    type: DesignationResponseDto,
    schema: { example: designationResponseExample },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  async create(
    @Body() dto: CreateDesignationDto,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DesignationResponseDto> {
    return (await this.designationsService.create(
      {
        ...dto,
        organizationId: req.user.organizationId,
      },
    )) as DesignationResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'List designations' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization id',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiOkResponse({
    description: 'Designation list',
    type: DesignationResponseDto,
    isArray: true,
    schema: { example: [designationResponseExample] },
  })
  async findAll(
    @Req() req: { user: { organizationId: string } },
  ): Promise<DesignationResponseDto[]> {
    return (await this.designationsService.findAll(
      req.user.organizationId,
    )) as DesignationResponseDto[];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get designation by id' })
  @ApiParam({
    name: 'id',
    description: 'Designation id',
    example: 'cm9z9u0g30000r4v0h8x8a7nd',
  })
  @ApiOkResponse({
    description: 'Designation details',
    type: DesignationResponseDto,
    schema: { example: designationResponseExample },
  })
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DesignationResponseDto> {
    return this.designationsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update designation by id' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'Designation id',
    example: 'cm9z9u0g30000r4v0h8x8a7nd',
  })
  @ApiBody({
    type: UpdateDesignationDto,
    examples: {
      updateDesignation: {
        summary: 'Update designation payload',
        value: {
          name: 'Lead Backend Engineer',
          code: 'LBE-4',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Designation updated successfully',
    type: DesignationResponseDto,
    schema: {
      example: {
        ...designationResponseExample,
        name: 'Lead Backend Engineer',
        code: 'LBE-4',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DesignationResponseDto> {
    return this.designationsService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Delete designation by id' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'Designation id',
    example: 'cm9z9u0g30000r4v0h8x8a7nd',
  })
  @ApiOkResponse({
    description: 'Designation deleted successfully',
    type: DeleteDesignationResponseDto,
    schema: {
      example: {
        deleted: true,
        id: 'cm9z9u0g30000r4v0h8x8a7nd',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  remove(
    @Param('id') id: string,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DeleteDesignationResponseDto> {
    return this.designationsService.remove(id, req.user.organizationId);
  }
}
