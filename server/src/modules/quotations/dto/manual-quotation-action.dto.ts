import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ManualQuotationActionDto {
  @IsString()
  actorUserId!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  note?: string;
}
