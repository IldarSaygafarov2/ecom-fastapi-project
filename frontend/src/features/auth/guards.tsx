import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/auth/use-auth"
import type { UserRole } from "@/types/api"

export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.isLoading) {
    return <p>Loading session...</p>
  }
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireRole({ roles }: { roles: UserRole[] }) {
  const auth = useAuth()
  if (auth.isLoading) {
    return <p>Checking permissions...</p>
  }
  if (!auth.hasRole(roles)) {
    return <Navigate to="/403" replace />
  }
  return <Outlet />
}
