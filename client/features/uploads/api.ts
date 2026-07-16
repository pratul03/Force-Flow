import { apiClient } from "@/lib/api-client";
import { ConfirmedUploadResponse, SignedUploadPayload, ApiResponse } from "@/lib/types";
import { processImageBeforeUpload } from "@/lib/image-processing";

type CloudinaryDirectUploadResponse = {
  secure_url: string;
  public_id: string;
};

async function uploadFileToCloudinary(
  file: File,
  payload: SignedUploadPayload,
): Promise<
  ApiResponse<CloudinaryDirectUploadResponse>
> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', payload.apiKey);
    formData.append('timestamp', payload.timestamp.toString());
    formData.append('signature', payload.signature);

    const response = await fetch(payload.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | CloudinaryDirectUploadResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok || !data || !('secure_url' in data) || !('public_id' in data)) {
      return {
        success: false,
        error:
          (data && 'error' in data && data.error?.message) ||
          'Cloudinary direct upload failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cloudinary upload failed',
    };
  }
}

export const uploadsApi = {
  getUserProfilePhotoSignature: (userId: string) =>
    apiClient.post<SignedUploadPayload>(
      `/uploads/users/${userId}/profile-photo/signature`,
    ),

  confirmUserProfilePhoto: (
    userId: string,
    payload: { secureUrl: string; publicId: string },
  ) =>
    apiClient.patch<ConfirmedUploadResponse>(
      `/uploads/users/${userId}/profile-photo/confirm`,
      payload,
    ),

  async uploadUserProfilePhotoDirect(userId: string, file: File) {
    const preparedFile = await processImageBeforeUpload(file, {
      cropSquare: true,
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      outputType: 'image/webp',
    });

    const signed = await this.getUserProfilePhotoSignature(userId);

    if (!signed.success || !signed.data) {
      return {
        success: false,
        error: signed.error || 'Failed to get upload signature',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    const uploaded = await uploadFileToCloudinary(preparedFile, signed.data);
    if (!uploaded.success || !uploaded.data) {
      return {
        success: false,
        error: uploaded.error || 'Failed to upload image to Cloudinary',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    return this.confirmUserProfilePhoto(userId, {
      secureUrl: uploaded.data.secure_url,
      publicId: uploaded.data.public_id,
    });
  },

  deleteUserProfilePhoto: (userId: string) =>
    apiClient.delete<ConfirmedUploadResponse>(
      `/uploads/users/${userId}/profile-photo`,
    ),

  getOrganizationLogoSignature: (organizationId: string) =>
    apiClient.post<SignedUploadPayload>(
      `/uploads/organizations/${organizationId}/logo/signature`,
    ),

  confirmOrganizationLogo: (
    organizationId: string,
    payload: { secureUrl: string; publicId: string },
  ) =>
    apiClient.patch<ConfirmedUploadResponse>(
      `/uploads/organizations/${organizationId}/logo/confirm`,
      payload,
    ),

  async uploadOrganizationLogoDirect(organizationId: string, file: File) {
    const preparedFile = await processImageBeforeUpload(file, {
      maxWidth: 1200,
      maxHeight: 400,
      quality: 0.85,
      outputType: 'image/webp',
    });

    const signed = await this.getOrganizationLogoSignature(organizationId);

    if (!signed.success || !signed.data) {
      return {
        success: false,
        error: signed.error || 'Failed to get upload signature',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    const uploaded = await uploadFileToCloudinary(preparedFile, signed.data);
    if (!uploaded.success || !uploaded.data) {
      return {
        success: false,
        error: uploaded.error || 'Failed to upload image to Cloudinary',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    return this.confirmOrganizationLogo(organizationId, {
      secureUrl: uploaded.data.secure_url,
      publicId: uploaded.data.public_id,
    });
  },

  deleteOrganizationLogo: (organizationId: string) =>
    apiClient.delete<ConfirmedUploadResponse>(
      `/uploads/organizations/${organizationId}/logo`,
    ),
};
