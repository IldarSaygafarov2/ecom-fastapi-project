import { createContext } from "react"

import type { UserRead, UserRole } from "@/types/api"

export type AuthState = {
  user: UserRead | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthState | null>(null)
