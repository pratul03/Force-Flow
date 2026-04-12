import { IsString } from 'class-validator';

export class RemoveLeadDto {
  @IsString()
  actorUserId!: string;
}
