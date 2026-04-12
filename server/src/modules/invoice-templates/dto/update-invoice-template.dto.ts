import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateInvoiceTemplateDto {
  @ApiPropertyOptional({ example: 'Modern Payroll Invoice Template' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '<h1>Payroll Invoice - Updated</h1>' })
  @IsString()
  @IsOptional()
  headerHtml?: string;

  @ApiPropertyOptional({
    example:
      '<div>Invoice {{invoiceNumber}}</div><div>Employee {{employeeName}}</div><div>Amount {{grossAmount}}</div>',
  })
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @ApiPropertyOptional({ example: '<div>Authorized signature</div>' })
  @IsString()
  @IsOptional()
  footerHtml?: string;

  @ApiPropertyOptional({ example: '.invoice { color: #111; }' })
  @IsString()
  @IsOptional()
  css?: string;

  @ApiPropertyOptional({
    example: {
      invoiceNumber: 'Invoice number',
      employeeName: 'Employee full name',
      grossAmount: 'Invoice total amount',
    },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
