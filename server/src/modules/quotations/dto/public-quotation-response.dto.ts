import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PublicQuotationResponseDto {
  @IsString()
  @MaxLength(180)
  @IsOptional()
  clientName?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  note?: string;
}
