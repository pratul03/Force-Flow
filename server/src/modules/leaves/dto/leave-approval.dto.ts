import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveApprovalDto {
  @IsString()
  @IsNotEmpty()
  actorUserId!: string;
}
