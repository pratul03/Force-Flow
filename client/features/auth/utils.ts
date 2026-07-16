import { BackendUser, User } from "@/lib/types";

export function mapBackendUserToAuthUser(user: BackendUser): User {
  return {
    id: user.id,
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}
