import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LeaveCancelDto {
  @IsString()
  @IsNotEmpty()
  actorUserId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
