import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EmailTemplateQueryDto {
  @ApiPropertyOptional({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'LEAVE_APPROVED' })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
