import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LeaveCancelDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
