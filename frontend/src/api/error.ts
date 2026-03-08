import { AxiosError } from "axios"

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") {
      return detail
    }
    return `Request failed (${error.response?.status ?? "unknown"})`
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Unknown error"
}
