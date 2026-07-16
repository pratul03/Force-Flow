import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateDesignationDto {
  @ApiProperty({
    example: 'cm9z9u0g30000r4v0h8x8a7na',
    description: 'Organization id that owns this designation',
  })
  @IsString()
  @IsOptional()
  organizationId!: string;

  @ApiProperty({
    example: 'Senior Backend Engineer',
    description: 'Human readable designation name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'SBE-3',
    description: 'Short designation code unique within the organization',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ required: false, example: 60000 })
  @IsNumber()
  @IsOptional()
  minSalary?: number;

  @ApiProperty({ required: false, example: 90000 })
  @IsNumber()
  @IsOptional()
  maxSalary?: number;

  @ApiProperty({ required: false, example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}
