export interface Department {
  id: string;
  organizationId?: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  memberCount: number;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    name: string;
  };
}

export interface CreateDepartmentPayload {
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentPayload extends Partial<CreateDepartmentPayload> {}
