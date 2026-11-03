import type { ReactNode } from "react";

import {
  getCurrentUser,
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
} from "@/api/generated/users/users";
import { AuthContext } from "@/auth/AuthContext";
import { useAuthSession } from "@/auth/useAuthSession";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession();

  // Get the current user profile if there is a session
  const profile = useGetCurrentUser({
    query: {
      // Keep each session's profile separate in the cache
      queryKey: [...getGetCurrentUserQueryKey(), auth.sessionVersion],
      // Only load the profile when session tokens are available
      enabled: auth.hasSession,
      // Disable React Query retries; auth.request handles token retries
      retry: false,
      queryFn: ({ signal }) =>
        // Route getCurrentUser query through auth.request() wrapper
        // Adds the access token to the request, refreshing it if needed
        auth.request((options) => getCurrentUser({ ...options, signal })),
    },
  });

  const user = auth.hasSession ? (profile.data ?? null) : null;
  const isLoading = auth.isLoggingIn || (auth.hasSession && profile.isPending);

  let error = auth.error;
  if (error === null && auth.hasSession && profile.isError) {
    error = "Could not load your profile. Reload to try again.";
  }

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        error,
        login: auth.login,
        logout: auth.logout,
        request: auth.request,
      }}
    >
      {children}
    </AuthContext>
  );
}
