import { IsString } from 'class-validator';

export class DownloadQuotationPdfQueryDto {
  @IsString()
  actorUserId!: string;
}
