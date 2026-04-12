import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendMailAttachmentDto {
  @IsString()
  @MaxLength(255)
  id!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(255)
  type!: string;

  @IsString()
  contentBase64!: string;
}

export class SendMailDto {
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  to!: string;

  @IsString()
  @MaxLength(1000)
  subject!: string;

  @IsString()
  @MaxLength(100000)
  body!: string;

  @IsOptional()
  @IsString()
  @IsIn(['gmail', 'outlook'])
  provider?: 'gmail' | 'outlook';

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SendMailAttachmentDto)
  attachments!: SendMailAttachmentDto[];
}
