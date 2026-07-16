import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import {
  DeleteDepartmentResponseDto,
  DepartmentResponseDto,
} from '../dto/department-response.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';

const departmentBodyExample = {
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  name: 'Engineering',
  code: 'ENG',
};

const departmentResponseExample = {
  id: 'cm9z9u0g30000r4v0h8x8a7nb',
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  name: 'Engineering',
  code: 'ENG',
  createdAt: '2026-04-10T09:30:00.000Z',
  updatedAt: '2026-04-10T09:30:00.000Z',
};

@ApiTags('Departments')
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  private getOrgId(req: { user: { organizationId: string } }) {
    return req.user.organizationId;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create a department' })
  @ApiBody({
    type: CreateDepartmentDto,
    examples: {
      createDepartment: {
        summary: 'Create department payload',
        value: departmentBodyExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Department created successfully',
    type: DepartmentResponseDto,
    schema: { example: departmentResponseExample },
  })
  create(
    @Body() dto: CreateDepartmentDto,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.create(dto, this.getOrgId(req));
  }

  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization id',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiOkResponse({
    description: 'Department list',
    type: DepartmentResponseDto,
    isArray: true,
    schema: { example: [departmentResponseExample] },
  })
  findAll(
    @Req() req: { user: { organizationId: string } },
  ): Promise<DepartmentResponseDto[]> {
    return this.departmentsService.findAll(this.getOrgId(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id' })
  @ApiParam({
    name: 'id',
    description: 'Department id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiOkResponse({
    description: 'Department details',
    type: DepartmentResponseDto,
    schema: { example: departmentResponseExample },
  })
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.findOne(id, this.getOrgId(req));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department by id' })
  @ApiParam({
    name: 'id',
    description: 'Department id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiBody({
    type: UpdateDepartmentDto,
    examples: {
      updateDepartment: {
        summary: 'Update department payload',
        value: {
          name: 'Platform Engineering',
          code: 'PLAT',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Department updated successfully',
    type: DepartmentResponseDto,
    schema: {
      example: {
        ...departmentResponseExample,
        name: 'Platform Engineering',
        code: 'PLAT',
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.update(id, dto, this.getOrgId(req));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department by id' })
  @ApiParam({
    name: 'id',
    description: 'Department id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiOkResponse({
    description: 'Department deleted successfully',
    type: DeleteDepartmentResponseDto,
    schema: {
      example: {
        deleted: true,
        id: 'cm9z9u0g30000r4v0h8x8a7nb',
      },
    },
  })
  remove(
    @Param('id') id: string,
    @Req() req: { user: { organizationId: string } },
  ): Promise<DeleteDepartmentResponseDto> {
    return this.departmentsService.remove(id, this.getOrgId(req));
  }
}
