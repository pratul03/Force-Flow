import {
  Currency,
  EmploymentType,
  Language,
  Role,
  UserStatus,
} from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsEmail, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(Language)
  @IsOptional()
  preferredLanguage?: Language;

  @IsEnum(Currency)
  @IsOptional()
  preferredCurrency?: Currency;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  designationId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  managerId?: string;
}
