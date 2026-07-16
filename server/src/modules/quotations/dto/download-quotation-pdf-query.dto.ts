import { IsOptional, IsString } from 'class-validator';

export class DownloadQuotationPdfQueryDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;
}
