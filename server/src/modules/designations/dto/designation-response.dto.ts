import { ApiProperty } from '@nestjs/swagger';

export class DesignationResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7nd' })
  id!: string;

  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  organizationId!: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  name!: string;

  @ApiProperty({ example: 'SBE-3' })
  code!: string;

  @ApiProperty({ example: '2026-04-10T09:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-10T09:30:00.000Z' })
  updatedAt!: Date;
}

export class DeleteDesignationResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;

  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7nd' })
  id!: string;
}
