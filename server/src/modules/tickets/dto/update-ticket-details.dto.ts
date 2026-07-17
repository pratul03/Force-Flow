import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTicketDetailsDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;
}
