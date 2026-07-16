export interface BackendShift {
  id: string;
  organizationId: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  halfDayMarkMins: number;
  workingDays: number[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMins?: number;
  halfDayMarkMins?: number;
  workingDays?: number[];
  isDefault?: boolean;
}

export interface UpdateShiftPayload extends Partial<CreateShiftPayload> {
  isActive?: boolean;
}

export interface ShiftAssignmentPayload {
  userId: string;
  startDate: string;
  endDate?: string;
}
