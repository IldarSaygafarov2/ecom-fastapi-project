import { AxiosError } from "axios"

/** FastAPI validation detail item */
function isValidationDetail(d: unknown): d is { loc?: unknown[]; msg?: string } {
  return typeof d === "object" && d !== null && "msg" in d
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (isValidationDetail(first) && typeof first.msg === "string") {
        return first.msg
      }
    }
    const status = error.response?.status ?? "unknown"
    return `Request failed (${status})`
  }
  if (error instanceof Error) return error.message
  return "Unknown error"
}
