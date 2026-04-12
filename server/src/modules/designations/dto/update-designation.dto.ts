import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDesignationDto {
  @ApiPropertyOptional({
    example: 'Lead Backend Engineer',
    description: 'Updated designation name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'LBE-4',
    description: 'Updated designation code',
  })
  @IsString()
  @IsOptional()
  code?: string;
}
