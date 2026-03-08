import { http } from "@/api/http"
import type { TokenPair, UserRead } from "@/types/api"

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload extends LoginPayload {
  full_name?: string
}

export const authApi = {
  login(payload: LoginPayload) {
    return http.post<TokenPair>("/auth/login", payload).then((res) => res.data)
  },
  register(payload: RegisterPayload) {
    return http.post<UserRead>("/auth/register", payload).then((res) => res.data)
  },
  me() {
    return http.get<UserRead>("/auth/me").then((res) => res.data)
  },
  refresh(refreshToken: string) {
    return http.post<TokenPair>("/auth/refresh", { refresh_token: refreshToken }).then((res) => res.data)
  },
}
