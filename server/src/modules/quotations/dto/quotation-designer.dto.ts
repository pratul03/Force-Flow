import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QuotationDesignerDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  companyDisplayName?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @MaxLength(30)
  @IsOptional()
  accentColor?: string;

  @IsString()
  @MaxLength(8000)
  @IsOptional()
  headerHtml?: string;

  @IsString()
  @MaxLength(8000)
  @IsOptional()
  footerHtml?: string;
}
