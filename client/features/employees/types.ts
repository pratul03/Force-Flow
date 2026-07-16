import { BackendUser, Employee } from '@/lib/types';
import { UserRole, UserStatus } from '@/lib/types';

export interface CreateEmployeePayload {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  employeeId?: string;
  departmentId?: string;
  designationId?: string;
  locationId?: string;
  managerId?: string;
  joiningDate?: string;
  password?: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}
