import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo-cloud/image/upload/v1710000000/flowforce/users/cma123/profile/avatar-1710000000.png',
  })
  @IsUrl()
  secureUrl!: string;

  @ApiProperty({ example: 'flowforce/users/cma123/profile/avatar-1710000000' })
  @IsString()
  publicId!: string;
}
