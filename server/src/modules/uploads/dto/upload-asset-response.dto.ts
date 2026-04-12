import { ApiProperty } from '@nestjs/swagger';

export class UploadUserAssetResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  userId!: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo-cloud/image/upload/v1710000000/flowforce/users/cma123/profile/avatar-1710000000.png',
  })
  avatarUrl!: string;

  @ApiProperty({ example: 'flowforce/users/cma123/profile/avatar-1710000000' })
  publicId!: string;
}

export class UploadOrganizationAssetResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7nb' })
  organizationId!: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo-cloud/image/upload/v1710000000/flowforce/organizations/cma123/logo/logo-1710000000.png',
  })
  logoUrl!: string;

  @ApiProperty({ example: 'flowforce/organizations/cma123/logo/logo-1710000000' })
  publicId!: string;
}

export class DeleteUserAssetResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7na' })
  userId!: string;

  @ApiProperty({ example: true })
  removed!: boolean;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl!: string | null;
}

export class DeleteOrganizationAssetResponseDto {
  @ApiProperty({ example: 'cm9z9u0g30000r4v0h8x8a7nb' })
  organizationId!: string;

  @ApiProperty({ example: true })
  removed!: boolean;

  @ApiProperty({ example: null, nullable: true })
  logoUrl!: string | null;
}
