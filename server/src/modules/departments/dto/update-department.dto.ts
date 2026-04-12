import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Platform Engineering' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'PLAT' })
  @IsString()
  @IsOptional()
  code?: string;
}
