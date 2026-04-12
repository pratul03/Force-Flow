import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import {
  DeleteEmailTemplateResponseDto,
  EmailTemplateResponseDto,
} from '../dto/email-template-response.dto';
import { EmailTemplateQueryDto } from '../dto/email-template-query.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';
import { EmailTemplatesService } from '../services/email-templates.service';

const createEmailTemplateExample = {
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  key: 'LEAVE_APPROVED',
  name: 'Leave Approved Notification',
  subject: 'Your leave request is approved',
  body: 'Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} is approved.',
  variables: {
    firstName: 'Employee first name',
    startDate: 'Leave start date',
    endDate: 'Leave end date',
  },
  isActive: true,
};

const emailTemplateResponseExample = {
  id: 'cm9z9u0g30000r4v0h8x8a7et',
  organizationId: 'cm9z9u0g30000r4v0h8x8a7na',
  key: 'LEAVE_APPROVED',
  name: 'Leave Approved Notification',
  subject: 'Your leave request is approved',
  body: 'Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} is approved.',
  variables: {
    firstName: 'Employee first name',
    startDate: 'Leave start date',
    endDate: 'Leave end date',
  },
  isActive: true,
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
};

@ApiTags('Email Templates')
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create an email template' })
  @ApiBearerAuth('access-token')
  @ApiBody({
    type: CreateEmailTemplateDto,
    examples: {
      createEmailTemplate: {
        summary: 'Create email template payload',
        value: createEmailTemplateExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Email template created successfully',
    type: EmailTemplateResponseDto,
    schema: { example: emailTemplateResponseExample },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  async create(
    @Body() dto: CreateEmailTemplateDto,
  ): Promise<EmailTemplateResponseDto> {
    return (await this.emailTemplatesService.create(dto)) as EmailTemplateResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'List email templates' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiQuery({
    name: 'key',
    required: false,
    example: 'LEAVE_APPROVED',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    example: true,
  })
  @ApiOkResponse({
    description: 'Email template list',
    type: EmailTemplateResponseDto,
    isArray: true,
    schema: { example: [emailTemplateResponseExample] },
  })
  async findAll(
    @Query() query: EmailTemplateQueryDto,
  ): Promise<EmailTemplateResponseDto[]> {
    return (await this.emailTemplatesService.findAll(query)) as EmailTemplateResponseDto[];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email template by id' })
  @ApiParam({
    name: 'id',
    example: 'cm9z9u0g30000r4v0h8x8a7et',
  })
  @ApiOkResponse({
    description: 'Email template details',
    type: EmailTemplateResponseDto,
    schema: { example: emailTemplateResponseExample },
  })
  async findOne(@Param('id') id: string): Promise<EmailTemplateResponseDto> {
    return (await this.emailTemplatesService.findOne(id)) as EmailTemplateResponseDto;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update email template by id' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    example: 'cm9z9u0g30000r4v0h8x8a7et',
  })
  @ApiBody({
    type: UpdateEmailTemplateDto,
    examples: {
      updateEmailTemplate: {
        summary: 'Update email template payload',
        value: {
          subject: 'Your leave request has been approved',
          body: 'Hello {{firstName}}, your leave request is approved by {{approverName}}.',
          variables: {
            firstName: 'Employee first name',
            approverName: 'Approver full name',
          },
          isActive: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Email template updated successfully',
    type: EmailTemplateResponseDto,
    schema: {
      example: {
        ...emailTemplateResponseExample,
        subject: 'Your leave request has been approved',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplateResponseDto> {
    return (await this.emailTemplatesService.update(id, dto)) as EmailTemplateResponseDto;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Delete email template by id' })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    example: 'cm9z9u0g30000r4v0h8x8a7et',
  })
  @ApiOkResponse({
    description: 'Email template deleted successfully',
    type: DeleteEmailTemplateResponseDto,
    schema: {
      example: {
        deleted: true,
        id: 'cm9z9u0g30000r4v0h8x8a7et',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Insufficient role permission' })
  remove(@Param('id') id: string): Promise<DeleteEmailTemplateResponseDto> {
    return this.emailTemplatesService.remove(id);
  }
}
