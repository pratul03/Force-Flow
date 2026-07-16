import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendQuotationDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MaxLength(3000)
  @IsOptional()
  emailMessage?: string;
}
