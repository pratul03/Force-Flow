import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateQueueJobDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;

  @IsOptional()
  availableAt?: string;
}
