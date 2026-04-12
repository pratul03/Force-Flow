import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ENG' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
