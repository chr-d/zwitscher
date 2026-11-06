import { createContext, useContext } from "react";

import type {
  CurrentUserResponseDto,
  LoginRequestDto,
} from "@/api/generated/models";

type AuthContextValue = {
  hasSession: boolean;
  user: CurrentUserResponseDto | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: typeof fetch;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
