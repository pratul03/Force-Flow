import {
  Body,
  Delete,
  ForbiddenException,
  HttpStatus,
  Param,
  Patch,
  ParseFilePipeBuilder,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Controller,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';
import { SignedUploadResponseDto } from '../dto/signed-upload-response.dto';
import {
  DeleteOrganizationAssetResponseDto,
  DeleteUserAssetResponseDto,
  UploadOrganizationAssetResponseDto,
  UploadUserAssetResponseDto,
} from '../dto/upload-asset-response.dto';
import { UploadsService } from '../services/uploads.service';

type RequestUser = {
  sub: string;
  role: Role;
  organizationId: string;
};

type RequestWithUser = {
  user?: RequestUser;
};

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

const maxUploadSizeBytes = 5 * 1024 * 1024;
const imageMimeTypeRegex = /(jpg|jpeg|png|webp|gif|svg)$/i;

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('users/:userId/profile-photo/signature')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generate signed Cloudinary upload params for user profile photo',
  })
  @ApiParam({
    name: 'userId',
    description: 'Target user id',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiOkResponse({
    description: 'Signed params for direct browser-to-Cloudinary upload',
    type: SignedUploadResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Cannot generate signature for another user unless privileged',
  })
  async generateProfilePhotoSignature(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<SignedUploadResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const privilegedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.HR_MANAGER,
    ];
    const isPrivileged = privilegedRoles.includes(actor.role);

    if (actor.sub !== userId && !isPrivileged) {
      throw new ForbiddenException(
        'Cannot generate signature for another user profile photo',
      );
    }

    return this.uploadsService.getUserProfilePhotoSignature(userId);
  }

  @Patch('users/:userId/profile-photo/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Confirm uploaded profile photo and persist URL/publicId on user',
  })
  @ApiParam({
    name: 'userId',
    description: 'Target user id',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiBody({ type: ConfirmUploadDto })
  @ApiOkResponse({
    description: 'User avatar persisted and previous image cleaned up',
    type: UploadUserAssetResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Cannot confirm upload for another user unless privileged',
  })
  async confirmProfilePhoto(
    @Param('userId') userId: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: RequestWithUser,
  ): Promise<UploadUserAssetResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const privilegedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.HR_MANAGER,
    ];
    const isPrivileged = privilegedRoles.includes(actor.role);

    if (actor.sub !== userId && !isPrivileged) {
      throw new ForbiddenException('Cannot confirm profile photo for another user');
    }

    return this.uploadsService.confirmUserProfilePhoto(userId, dto);
  }

  @Delete('users/:userId/profile-photo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user profile photo and clear saved avatar' })
  @ApiParam({
    name: 'userId',
    description: 'Target user id',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiOkResponse({
    description: 'User avatar deleted and fields cleared',
    type: DeleteUserAssetResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Cannot delete profile photo for another user unless privileged',
  })
  async deleteProfilePhoto(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<DeleteUserAssetResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const privilegedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.HR_MANAGER,
    ];
    const isPrivileged = privilegedRoles.includes(actor.role);

    if (actor.sub !== userId && !isPrivileged) {
      throw new ForbiddenException('Cannot delete profile photo for another user');
    }

    return this.uploadsService.deleteUserProfilePhoto(userId);
  }

  @Post('users/:userId/profile-photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxUploadSizeBytes },
    }),
  )
  @ApiOperation({
    summary: 'Upload and store a user profile photo in Cloudinary',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'userId',
    description: 'Target user id for profile photo upload',
    example: 'cm9z9u0g30000r4v0h8x8a7na',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile photo uploaded and user avatar updated',
    schema: {
      example: {
        userId: 'cm9z9u0g30000r4v0h8x8a7na',
        avatarUrl:
          'https://res.cloudinary.com/acme/image/upload/v1710000000/flowforce/users/cm9z9u0g30000r4v0h8x8a7na/profile/avatar-1710000000.png',
        publicId:
          'flowforce/users/cm9z9u0g30000r4v0h8x8a7na/profile/avatar-1710000000',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'You can only upload your own photo unless you are an admin',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid file type or file size exceeds 5MB',
  })
  uploadProfilePhoto(
    @Param('userId') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: imageMimeTypeRegex })
        .addMaxSizeValidator({ maxSize: maxUploadSizeBytes })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    file: UploadFile,
    @Req() req: RequestWithUser,
  ) {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const privilegedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.HR_MANAGER,
    ];
    const isPrivileged = privilegedRoles.includes(actor.role);

    if (actor.sub !== userId && !isPrivileged) {
      throw new ForbiddenException('Cannot upload profile photo for another user');
    }

    return this.uploadsService.uploadUserProfilePhoto(userId, file);
  }

  @Post('organizations/:organizationId/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxUploadSizeBytes },
    }),
  )
  @ApiOperation({
    summary: 'Upload and store an organization logo in Cloudinary',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'organizationId',
    description: 'Target organization id for logo upload',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Organization logo uploaded and organization updated',
    schema: {
      example: {
        organizationId: 'cm9z9u0g30000r4v0h8x8a7nb',
        logoUrl:
          'https://res.cloudinary.com/acme/image/upload/v1710000000/flowforce/organizations/cm9z9u0g30000r4v0h8x8a7nb/logo/logo-1710000000.png',
        publicId:
          'flowforce/organizations/cm9z9u0g30000r4v0h8x8a7nb/logo/logo-1710000000',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Only organization admins/HR can upload the logo',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid file type or file size exceeds 5MB',
  })
  uploadOrganizationLogo(
    @Param('organizationId') organizationId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: imageMimeTypeRegex })
        .addMaxSizeValidator({ maxSize: maxUploadSizeBytes })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    file: UploadFile,
    @Req() req: RequestWithUser,
  ) {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const canManageAnyOrganization = actor.role === Role.SUPER_ADMIN;

    if (!canManageAnyOrganization && actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot upload logo for a different organization',
      );
    }

    return this.uploadsService.uploadOrganizationLogo(organizationId, file);
  }

  @Post('organizations/:organizationId/logo/signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({
    summary: 'Generate signed Cloudinary upload params for organization logo',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Target organization id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiOkResponse({
    description: 'Signed params for direct browser-to-Cloudinary upload',
    type: SignedUploadResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Only organization admins/HR can request logo upload signature',
  })
  async generateOrganizationLogoSignature(
    @Param('organizationId') organizationId: string,
    @Req() req: RequestWithUser,
  ): Promise<SignedUploadResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const canManageAnyOrganization = actor.role === Role.SUPER_ADMIN;

    if (!canManageAnyOrganization && actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot generate logo signature for a different organization',
      );
    }

    return this.uploadsService.getOrganizationLogoSignature(organizationId);
  }

  @Patch('organizations/:organizationId/logo/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({
    summary: 'Confirm uploaded organization logo and persist URL/publicId',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Target organization id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiBody({ type: ConfirmUploadDto })
  @ApiOkResponse({
    description: 'Organization logo persisted and previous image cleaned up',
    type: UploadOrganizationAssetResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Only organization admins/HR can confirm logo uploads',
  })
  async confirmOrganizationLogo(
    @Param('organizationId') organizationId: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: RequestWithUser,
  ): Promise<UploadOrganizationAssetResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const canManageAnyOrganization = actor.role === Role.SUPER_ADMIN;

    if (!canManageAnyOrganization && actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot confirm logo for a different organization',
      );
    }

    return this.uploadsService.confirmOrganizationLogo(organizationId, dto);
  }

  @Delete('organizations/:organizationId/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  @ApiOperation({
    summary: 'Delete organization logo and clear saved logo fields',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Target organization id',
    example: 'cm9z9u0g30000r4v0h8x8a7nb',
  })
  @ApiOkResponse({
    description: 'Organization logo deleted and fields cleared',
    type: DeleteOrganizationAssetResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'Only organization admins/HR can delete logo',
  })
  async deleteOrganizationLogo(
    @Param('organizationId') organizationId: string,
    @Req() req: RequestWithUser,
  ): Promise<DeleteOrganizationAssetResponseDto> {
    const actor = req.user;
    if (!actor) {
      throw new ForbiddenException('Missing authenticated user context');
    }

    const canManageAnyOrganization = actor.role === Role.SUPER_ADMIN;

    if (!canManageAnyOrganization && actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot delete logo for a different organization',
      );
    }

    return this.uploadsService.deleteOrganizationLogo(organizationId);
  }
}
