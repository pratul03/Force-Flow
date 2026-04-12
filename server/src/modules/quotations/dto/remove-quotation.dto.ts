import { IsString } from 'class-validator';

export class RemoveQuotationDto {
  @IsString()
  actorUserId!: string;
}
