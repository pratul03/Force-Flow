import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  resolutionNote?: string;
}
