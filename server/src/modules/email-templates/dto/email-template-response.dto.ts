import { ApiProperty } from '@nestjs/swagger';

export class EmailTemplateResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7et' })
  id!: string;

  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  organizationId!: string;

  @ApiProperty({ example: 'LEAVE_APPROVED' })
  key!: string;

  @ApiProperty({ example: 'Leave Approved Notification' })
  name!: string;

  @ApiProperty({ example: 'Your leave request is approved' })
  subject!: string;

  @ApiProperty({
    example: 'Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} is approved.',
  })
  body!: string;

  @ApiProperty({
    example: {
      firstName: 'Employee first name',
      startDate: 'Leave start date',
      endDate: 'Leave end date',
    },
    nullable: true,
  })
  variables!: Record<string, unknown> | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z' })
  updatedAt!: Date;
}

export class DeleteEmailTemplateResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;

  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7et' })
  id!: string;
}
