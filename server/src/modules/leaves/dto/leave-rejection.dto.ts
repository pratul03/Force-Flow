import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveRejectionDto {
  @IsString()
  @IsNotEmpty()
  actorUserId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
