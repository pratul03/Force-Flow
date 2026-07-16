import { IsOptional, IsString } from 'class-validator';

export class RemoveLeadDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;
}
