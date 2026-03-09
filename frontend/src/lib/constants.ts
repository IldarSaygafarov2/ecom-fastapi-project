function getApiBaseUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
  if (typeof window !== "undefined" && window.location.protocol === "https:" && env.startsWith("http://")) {
    return env.replace("http://", "https://")
  }
  return env
}

export const API_BASE_URL = getApiBaseUrl()
export const ACCESS_TOKEN_KEY = "taskflow_access_token"
export const REFRESH_TOKEN_KEY = "taskflow_refresh_token"
