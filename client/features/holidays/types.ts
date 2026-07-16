export type HolidayType = 'PUBLIC' | 'COMPANY' | 'OPTIONAL';

export interface BackendHoliday {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string | null;
  locations?: { id: string; name: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayPayload {
  name: string;
  date: string;
  type?: HolidayType;
  description?: string;
  locationIds?: string[];
}

export interface UpdateHolidayPayload extends Partial<CreateHolidayPayload> {
  isActive?: boolean;
}
