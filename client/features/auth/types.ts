import { BackendUser } from "@/lib/types";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: BackendUser;
}
