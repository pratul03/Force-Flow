import { BackendUser, Employee } from "@/lib/types";

export function mapBackendUserToEmployee(user: BackendUser): Employee {
  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    department: user.departmentId || 'Unassigned',
    position: user.role,
    joinDate: user.joiningDate || new Date().toISOString(),
    status: user.status === 'INACTIVE' ? 'inactive' : 'active',
    employeeId: user.employeeId,
    organizationId: user.organizationId,
    departmentId: user.departmentId,
    designationId: user.designationId,
    locationId: user.locationId,
    managerId: user.managerId,
  };
}
