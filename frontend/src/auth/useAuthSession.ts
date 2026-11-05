import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  logout as apiLogout,
  refresh,
  useLogin,
} from "@/api/generated/auth/auth";
import type { LoginRequestDto, LoginResponseDto } from "@/api/generated/models";
import { getRefreshToken, saveRefreshToken } from "@/auth/tokenStorage";

type Session = {
  // Login/logout change version, refreshing tokens keeps the same version
  version: number;
  tokens: LoginResponseDto | null;
};

type PendingRefresh = {
  tokens: Promise<LoginResponseDto>;
  accessToken: Promise<string>;
};

const REFRESH_EARLY_MS = 30_000;

function getHttpStatus(error: unknown) {
  return (error as { status?: number } | null)?.status;
}

export function useAuthSession() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session>({ version: 0, tokens: null });
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin({ mutation: { retry: false } });

  /// Let async requests read the latest session without waiting for a render
  const currentSession = useRef(session);

  // Requests share any token refresh already in progress
  const pendingRefreshRequest = useRef<PendingRefresh | null>(null);

  // Ensure that the session hasn't changed since the caller started an operation
  function validateSessionVersion(version: number) {
    if (currentSession.current.version !== version) {
      throw new Error("The login session changed. Please try again.");
    }
  }

  // Keep the reference, rendered state, and saved refresh token in sync
  function updateSession(nextSession: Session) {
    currentSession.current = nextSession;
    setSession(nextSession);
    saveRefreshToken(nextSession.tokens?.refreshToken ?? null);
    setError(null);
  }

  // Change the session version and clear the cache on login/logout
  // Discard any ongoing refresh
  function replaceSession(tokens: LoginResponseDto | null) {
    updateSession({ version: currentSession.current.version + 1, tokens });
    pendingRefreshRequest.current = null;
    queryClient.clear();
  }

  // Save the current session version, then perform the login
  // If the session changed while logging in, throw an error instead of replacing the session
  async function login(data: LoginRequestDto) {
    const version = currentSession.current.version;
    const tokens = await loginMutation.mutateAsync({ data });
    validateSessionVersion(version);
    replaceSession(tokens);
  }

  async function logout(): Promise<void> {
    let tokens = currentSession.current.tokens;
    const refreshToken = getRefreshToken();
    const pendingRefresh = pendingRefreshRequest.current;
    replaceSession(null);

    if (!refreshToken) return;

    try {
      // If a refresh was already running, wait for its newest tokens
      if (pendingRefresh) tokens = await pendingRefresh.tokens;
      // Server logout needs a valid access token
      if (
        !tokens ||
        Date.parse(tokens.accessExpiresAtUtc) <= Date.now() + REFRESH_EARLY_MS
      ) {
        tokens = await refresh({
          // Prefer the newest refresh token, falling back to the saved one.
          refreshToken: tokens?.refreshToken ?? refreshToken,
        });
      }

      // Send the tokens directly because authFetch checks a session that is already cleared.
      await apiLogout(
        { refreshToken: tokens.refreshToken },
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
      );
    } catch {
      //TODO: Signed out locally but server logout not confirmed
    }
  }

  function expireSession() {
    replaceSession(null);
    setError("Your session expired. Please log in again.");
  }

  async function performRefresh(
    request: Promise<LoginResponseDto>,
    version: number,
  ) {
    try {
      const tokens = await request;
      validateSessionVersion(version);
      updateSession({ version, tokens });
      return tokens.accessToken;
    } catch (error) {
      validateSessionVersion(version);
      const status = getHttpStatus(error);

      // Rejected credentials end the session, network/server errors do not
      if (status === 400 || status === 401 || status === 403) {
        expireSession();
      } else {
        setError("Could not refresh your session. Please try again.");
      }
      throw error;
    } finally {
      // Clear the finished refresh without clearing a newer session's refresh
      if (currentSession.current.version === version) {
        pendingRefreshRequest.current = null;
      }
    }
  }

  function refreshAccessToken(): Promise<string> {
    // If a refresh is already in progress, return the same promise instead of starting a new one
    if (pendingRefreshRequest.current)
      return pendingRefreshRequest.current.accessToken;

    // Without a refresh token no refresh is possible
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error("Please log in again."));
    }

    // Start a new refresh request
    const tokens = refresh({ refreshToken });
    const accessToken = performRefresh(tokens, currentSession.current.version);
    pendingRefreshRequest.current = { tokens, accessToken };
    return accessToken;
  }

  // Use the current access token, or refresh if it is missing/expiring soon
  async function getAccessToken(): Promise<string> {
    const tokens = currentSession.current.tokens;

    if (tokens) {
      const expiresAt = Date.parse(tokens.accessExpiresAtUtc);
      if (expiresAt > Date.now() + REFRESH_EARLY_MS) {
        return tokens.accessToken;
      }
    }

    return refreshAccessToken();
  }

  /**
   * Fetch with an access token, refreshing it first if needed.
   * Pass as the fetcher option to generated hooks that need authentication.
   */
  async function authFetch(
    input: RequestInfo | URL,
    options?: RequestInit,
  ): Promise<Response> {
    const version = currentSession.current.version;

    async function send(accessToken: string) {
      validateSessionVersion(version);
      const headers = new Headers(
        input instanceof Request ? input.headers : undefined,
      );
      new Headers(options?.headers).forEach((value, name) =>
        headers.set(name, value),
      );
      headers.set("Authorization", `Bearer ${accessToken}`);

      const result = await fetch(
        input instanceof Request ? input.clone() : input,
        {
          ...options,
          headers,
        },
      );
      validateSessionVersion(version);
      if (result.ok) setError(null);
      return result;
    }

    // Get a usable token and make the request
    const token = await getAccessToken();
    const result = await send(token);
    if (result.status !== 401) return result;
    await result.body?.cancel();
    validateSessionVersion(version);

    // 401 means the API rejected the token
    // Get a replacement, unless another request has already refreshed it
    const latestToken = currentSession.current.tokens?.accessToken;
    let retryToken: string;
    if (latestToken && latestToken !== token) {
      retryToken = latestToken;
    } else {
      retryToken = await refreshAccessToken();
    }

    // Retry once, a second 401 ends the session instead of starting a loop
    const retryResult = await send(retryToken);
    if (retryResult.status === 401) expireSession();
    return retryResult;
  }

  return {
    sessionVersion: session.version,
    hasSession: Boolean(session.tokens || getRefreshToken()),
    isLoggingIn: loginMutation.isPending,
    error,
    login,
    logout,
    authFetch,
  };
}
