import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../../prisma/prisma.service';

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

type SignedUploadPayload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
  uploadUrl: string;
};

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Injectable()
export class UploadsService {
  private readonly cloudinaryConfigured: boolean;
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '';
    this.apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') || '';

    this.cloudinaryConfigured = Boolean(
      this.cloudName && this.apiKey && this.apiSecret,
    );

    if (this.cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  async getUserProfilePhotoSignature(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.generateSignedUploadPayload({
      folder: `flowforce/users/${userId}/profile`,
      publicIdPrefix: 'avatar',
    });
  }

  async getOrganizationLogoSignature(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.generateSignedUploadPayload({
      folder: `flowforce/organizations/${organizationId}/logo`,
      publicIdPrefix: 'logo',
    });
  }

  async uploadUserProfilePhoto(userId: string, file: UploadFile) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploaded = await this.uploadImage(file, {
      folder: `flowforce/users/${userId}/profile`,
      publicIdPrefix: 'avatar',
    });

    const existingAvatarPublicId =
      this.normalizeNullableString(
        (user as Record<string, unknown>).avatarPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (user as Record<string, unknown>).avatarUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(
      existingAvatarPublicId,
      uploaded.public_id,
    );

    const userUpdateData = {
      avatarUrl: uploaded.secure_url,
      avatarPublicId: uploaded.public_id,
    } as Parameters<typeof this.prisma.user.update>[0]['data'];

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    return {
      userId,
      avatarUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  async confirmUserProfilePhoto(
    userId: string,
    payload: { secureUrl: string; publicId: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.validateCloudinaryAsset(payload.secureUrl, payload.publicId);

    const existingAvatarPublicId =
      this.normalizeNullableString(
        (user as Record<string, unknown>).avatarPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (user as Record<string, unknown>).avatarUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(
      existingAvatarPublicId,
      payload.publicId,
    );

    const userUpdateData = {
      avatarUrl: payload.secureUrl,
      avatarPublicId: payload.publicId,
    } as Parameters<typeof this.prisma.user.update>[0]['data'];

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    return {
      userId,
      avatarUrl: payload.secureUrl,
      publicId: payload.publicId,
    };
  }

  async deleteUserProfilePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingAvatarPublicId =
      this.normalizeNullableString(
        (user as Record<string, unknown>).avatarPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (user as Record<string, unknown>).avatarUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(existingAvatarPublicId);

    const userUpdateData = {
      avatarUrl: null,
      avatarPublicId: null,
    } as Parameters<typeof this.prisma.user.update>[0]['data'];

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    return {
      userId,
      removed: Boolean(existingAvatarPublicId),
      avatarUrl: null,
    };
  }

  async uploadOrganizationLogo(organizationId: string, file: UploadFile) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        logoUrl: true,
        logoPublicId: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const uploaded = await this.uploadImage(file, {
      folder: `flowforce/organizations/${organizationId}/logo`,
      publicIdPrefix: 'logo',
    });

    const existingLogoPublicId =
      this.normalizeNullableString(
        (organization as Record<string, unknown>).logoPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (organization as Record<string, unknown>).logoUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(
      existingLogoPublicId,
      uploaded.public_id,
    );

    const organizationUpdateData = {
      logoUrl: uploaded.secure_url,
      logoPublicId: uploaded.public_id,
    } as Parameters<typeof this.prisma.organization.update>[0]['data'];

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: organizationUpdateData,
    });

    return {
      organizationId,
      logoUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  async confirmOrganizationLogo(
    organizationId: string,
    payload: { secureUrl: string; publicId: string },
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        logoUrl: true,
        logoPublicId: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    this.validateCloudinaryAsset(payload.secureUrl, payload.publicId);

    const existingLogoPublicId =
      this.normalizeNullableString(
        (organization as Record<string, unknown>).logoPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (organization as Record<string, unknown>).logoUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(
      existingLogoPublicId,
      payload.publicId,
    );

    const organizationUpdateData = {
      logoUrl: payload.secureUrl,
      logoPublicId: payload.publicId,
    } as Parameters<typeof this.prisma.organization.update>[0]['data'];

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: organizationUpdateData,
    });

    return {
      organizationId,
      logoUrl: payload.secureUrl,
      publicId: payload.publicId,
    };
  }

  async deleteOrganizationLogo(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        logoUrl: true,
        logoPublicId: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const existingLogoPublicId =
      this.normalizeNullableString(
        (organization as Record<string, unknown>).logoPublicId,
      ) ||
      this.extractPublicIdFromUrl(
        this.normalizeNullableString(
          (organization as Record<string, unknown>).logoUrl,
        ),
      );

    await this.removeCloudinaryAssetIfPresent(existingLogoPublicId);

    const organizationUpdateData = {
      logoUrl: null,
      logoPublicId: null,
    } as Parameters<typeof this.prisma.organization.update>[0]['data'];

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: organizationUpdateData,
    });

    return {
      organizationId,
      removed: Boolean(existingLogoPublicId),
      logoUrl: null,
    };
  }

  private async uploadImage(
    file: UploadFile,
    options: { folder: string; publicIdPrefix: string },
  ): Promise<CloudinaryUploadResult> {
    if (!this.cloudinaryConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: `${options.publicIdPrefix}-${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                error?.message || 'Cloudinary upload failed',
              ),
            );
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      upload.end(file.buffer);
    });
  }

  private generateSignedUploadPayload(options: {
    folder: string;
    publicIdPrefix: string;
  }): SignedUploadPayload {
    this.assertCloudinaryConfigured();

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${options.publicIdPrefix}-${Date.now()}`;
    const signature = cloudinary.utils.api_sign_request(
      {
        folder: options.folder,
        public_id: publicId,
        timestamp,
      },
      this.apiSecret,
    );

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      folder: options.folder,
      publicId,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  private assertCloudinaryConfigured() {
    if (!this.cloudinaryConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
  }

  private validateCloudinaryAsset(secureUrl: string, publicId: string) {
    if (
      !secureUrl.startsWith(`https://res.cloudinary.com/${this.cloudName}/`)
    ) {
      throw new BadRequestException(
        'Uploaded asset URL is not from configured Cloudinary account',
      );
    }

    if (!publicId || publicId.trim().length === 0) {
      throw new BadRequestException('publicId is required');
    }
  }

  private async removeCloudinaryAssetIfPresent(
    existingPublicId?: string | null,
    replacementPublicId?: string,
  ) {
    if (!existingPublicId || existingPublicId === replacementPublicId) {
      return;
    }

    if (!this.cloudinaryConfigured) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(existingPublicId, {
        resource_type: 'image',
      });
    } catch {
      // Ignore cleanup failures so profile/logo updates are not blocked.
    }
  }

  private extractPublicIdFromUrl(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    const marker = '/upload/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) {
      return undefined;
    }

    let path = url.slice(markerIndex + marker.length);

    if (path.startsWith('v')) {
      const firstSlash = path.indexOf('/');
      if (firstSlash > 0 && /^v\d+$/.test(path.slice(0, firstSlash))) {
        path = path.slice(firstSlash + 1);
      }
    }

    const extensionIndex = path.lastIndexOf('.');
    if (extensionIndex > 0) {
      path = path.slice(0, extensionIndex);
    }

    return path || undefined;
  }

  private normalizeNullableString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
