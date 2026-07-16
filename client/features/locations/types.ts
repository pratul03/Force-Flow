export interface BackendLocation {
  id: string;
  organizationId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  timezone?: string;
  isDefault?: boolean;
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  isActive?: boolean;
}
