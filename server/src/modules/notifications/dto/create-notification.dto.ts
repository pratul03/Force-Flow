import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

type NotificationValidationContext = {
  templateKey?: string;
};

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsString()
  @IsOptional()
  templateKey?: string;

  @IsObject()
  @IsOptional()
  templateData?: Record<string, unknown>;

  @ValidateIf((dto: NotificationValidationContext) => !dto.templateKey)
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ValidateIf((dto: NotificationValidationContext) => !dto.templateKey)
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
