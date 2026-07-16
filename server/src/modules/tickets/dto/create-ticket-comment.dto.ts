import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTicketCommentDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
