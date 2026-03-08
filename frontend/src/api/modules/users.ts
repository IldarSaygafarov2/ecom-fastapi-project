import { http } from "@/api/http"
import type { UserRead, UserRole } from "@/types/api"

export const usersApi = {
  list() {
    return http.get<UserRead[]>("/users").then((res) => res.data)
  },
  updateRole(userId: number, role: UserRole) {
    return http.patch<UserRead>(`/users/${userId}/role`, { role }).then((res) => res.data)
  },
}
