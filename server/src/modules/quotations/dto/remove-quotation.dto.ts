import { IsOptional, IsString } from 'class-validator';

export class RemoveQuotationDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;
}
