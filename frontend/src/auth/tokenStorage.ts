const key = "refreshToken";

export function getRefreshToken() {
  return localStorage.getItem(key);
}

export function saveRefreshToken(token: string) {
  localStorage.setItem(key, token);
}

export function removeRefreshToken() {
  localStorage.removeItem(key);
}
