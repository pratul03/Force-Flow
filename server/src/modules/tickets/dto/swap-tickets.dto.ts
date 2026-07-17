import { IsNotEmpty, IsString } from 'class-validator';

export class SwapTicketsDto {
  @IsString()
  @IsNotEmpty()
  ticket1Id!: string;

  @IsString()
  @IsNotEmpty()
  ticket2Id!: string;
}
