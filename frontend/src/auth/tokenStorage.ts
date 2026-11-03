const REFRESH_TOKEN_KEY = "refreshToken";
let refreshToken: string | null = null;

// Read the saved refresh token once when this module loads
try {
  refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;
} catch {
  // If localStorage cannot be read, start without a refresh token
}

export function getRefreshToken() {
  return refreshToken;
}

export function saveRefreshToken(token: string | null) {
  // Update memory first so this still works if localStorage fails
  refreshToken = token;
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Without localStorage the token is updated in memory, but the change won't survive a page reload
  }
}
