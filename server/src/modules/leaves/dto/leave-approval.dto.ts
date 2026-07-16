import { IsOptional, IsString } from 'class-validator';

export class LeaveApprovalDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;
}
