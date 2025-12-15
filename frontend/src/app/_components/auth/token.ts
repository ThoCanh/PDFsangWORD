export type TokenScope = "local" | "session";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("access_token") ||
    window.localStorage.getItem("access_token")
  );
}

export function setAccessToken(token: string, scope: TokenScope = "local") {
  if (typeof window === "undefined") return;
  if (scope === "session") {
    window.sessionStorage.setItem("access_token", token);
  } else {
    window.localStorage.setItem("access_token", token);
  }

  try {
    window.dispatchEvent(new StorageEvent("storage", { key: "access_token" }));
  } catch {}
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("access_token");
  window.localStorage.removeItem("access_token");

  try {
    window.dispatchEvent(new StorageEvent("storage", { key: "access_token" }));
  } catch {}
}
