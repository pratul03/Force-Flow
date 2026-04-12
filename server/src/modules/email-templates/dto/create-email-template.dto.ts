import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: 'LEAVE_APPROVED' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 'Leave Approved Notification' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Your leave request is approved' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    example:
      'Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} is approved.',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    example: {
      firstName: 'Employee first name',
      startDate: 'Leave start date',
      endDate: 'Leave end date',
    },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
