import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TicketReorderItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsNumber()
  orderIndex!: number;
}

export class ReorderTicketsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketReorderItemDto)
  updates!: TicketReorderItemDto[];
}
