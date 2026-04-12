import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({ example: 'Leave Approved Notification v2' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Your leave request has been approved' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({
    example: 'Hello {{firstName}}, your leave request is approved by {{approverName}}.',
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    example: {
      firstName: 'Employee first name',
      approverName: 'Approver full name',
    },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
