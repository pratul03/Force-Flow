export type AssetCategory = 'LAPTOP' | 'MOBILE' | 'ID_CARD' | 'ACCESS_CARD' | 'VEHICLE' | 'OTHER';
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR';

export interface BackendAsset {
  id: string;
  organizationId: string;
  name: string;
  assetCode: string;
  category: AssetCategory;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  purchaseDate?: string | null;
  purchaseValue?: number | null;
  currency: string;
  currentValue?: number | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  assignedDate?: string | null;
  expectedReturnDate?: string | null;
  returnedDate?: string | null;
  status: AssetStatus;
  condition?: AssetCondition | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetPayload {
  name: string;
  assetCode: string;
  category: AssetCategory;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currency?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  notes?: string;
}

export interface AssignAssetPayload {
  userId: string;
  assignedDate: string;
  expectedReturnDate?: string;
  conditionOnIssue?: AssetCondition;
  notes?: string;
}
