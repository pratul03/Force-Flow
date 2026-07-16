export interface Designation {
  id: string;
  organizationId?: string;
  name: string;
  code?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
}

export interface CreateDesignationPayload {
  organizationId: string;
  name: string;
  code?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
}

export interface UpdateDesignationPayload extends Partial<CreateDesignationPayload> {}
