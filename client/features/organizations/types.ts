export interface BackendOrganization {
  id: string;
  name: string;
  country: string;
  currency?: string;
  timezone?: string;
  logoUrl?: string | null;
}
