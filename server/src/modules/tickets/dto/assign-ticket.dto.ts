import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AssignTicketDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  assigneeId!: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
