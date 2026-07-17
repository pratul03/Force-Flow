import { BackendUser, Employee } from "@/lib/types";

export function mapBackendUserToEmployee(user: BackendUser): Employee {
  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    // department is the raw departmentId so the form can pre-fill and submit it back
    department: user.departmentId || '',
    // position is the user's role enum value
    position: user.role,
    joinDate: user.joiningDate
      ? user.joiningDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: user.status === 'INACTIVE' ? 'inactive' : 'active',
    employeeId: user.employeeId,
    organizationId: user.organizationId,
    departmentId: user.departmentId,
    designationId: user.designationId,
    locationId: user.locationId,
    managerId: user.managerId,
  };
}
