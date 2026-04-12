import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
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
  create(@Body() dto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    return this.departmentsService.create(dto);
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
    @Query('organizationId') organizationId?: string,
  ): Promise<DepartmentResponseDto[]> {
    return this.departmentsService.findAll(organizationId);
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
  findOne(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.departmentsService.findOne(id);
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
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.update(id, dto);
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
  remove(@Param('id') id: string): Promise<DeleteDepartmentResponseDto> {
    return this.departmentsService.remove(id);
  }
}
