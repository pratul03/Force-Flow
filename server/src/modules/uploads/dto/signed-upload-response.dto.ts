import { ApiProperty } from '@nestjs/swagger';

export class SignedUploadResponseDto {
  @ApiProperty({ example: 'demo-cloud' })
  cloudName!: string;

  @ApiProperty({ example: '123456789012345' })
  apiKey!: string;

  @ApiProperty({ example: 1710000000 })
  timestamp!: number;

  @ApiProperty({ example: 'flowforce/users/cma123/profile' })
  folder!: string;

  @ApiProperty({ example: 'avatar-1710000000' })
  publicId!: string;

  @ApiProperty({
    example: '2ad8e2f2b1f7f4f8f5a69ef0f0cd123456789abc',
  })
  signature!: string;

  @ApiProperty({ example: 'https://api.cloudinary.com/v1_1/demo-cloud/image/upload' })
  uploadUrl!: string;
}
