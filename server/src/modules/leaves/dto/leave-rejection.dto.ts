import { IsNotEmpty, IsString } from 'class-validator';
import { IsOptional } from 'class-validator';

export class LeaveRejectionDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
