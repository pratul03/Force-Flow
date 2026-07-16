import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ManualQuotationActionDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  note?: string;
}
