export interface SignedUploadResponse {
  signature: string;
  timestamp: number;
  publicId: string;
  apiKey: string;
  uploadUrl: string;
}

export interface ConfirmUploadPayload {
  publicId: string;
  secureUrl: string;
}

export interface UploadUserAssetResponse {
  userId: string;
  avatarUrl: string | null;
  publicId: string | null;
}

export interface UploadOrganizationAssetResponse {
  organizationId: string;
  logoUrl: string | null;
  publicId: string | null;
}
