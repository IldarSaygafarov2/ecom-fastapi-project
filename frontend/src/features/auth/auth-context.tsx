import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { authApi } from "@/api"
import { AuthContext, type AuthState } from "@/features/auth/auth-context-base"
import { tokenStorage } from "@/lib/storage"
import type { TokenPair, UserRead } from "@/types/api"

function saveTokenPair(pair: TokenPair) {
  tokenStorage.setTokens(pair.access_token, pair.refresh_token)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [accessToken, setAccessToken] = useState<string | null>(() => tokenStorage.getAccessToken())
  const [sessionUser, setSessionUser] = useState<UserRead | null>(null)
  const hasToken = !!accessToken

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: hasToken,
    retry: false,
  })

  const value = useMemo<AuthState>(
    () => {
      const user = meQuery.data ?? sessionUser
      return {
        user,
        isAuthenticated: hasToken || !!user,
        isLoading: hasToken && (meQuery.isLoading || meQuery.isFetching),
        async login(email, password) {
          const pair = await authApi.login({ email, password })
          saveTokenPair(pair)
          setAccessToken(pair.access_token)
          const me = await authApi.me()
          setSessionUser(me)
          queryClient.setQueryData(["auth", "me"], me)
        },
        async register(email, password, fullName) {
          await authApi.register({ email, password, full_name: fullName })
          const pair = await authApi.login({ email, password })
          saveTokenPair(pair)
          setAccessToken(pair.access_token)
          const me = await authApi.me()
          setSessionUser(me)
          queryClient.setQueryData(["auth", "me"], me)
        },
        logout() {
          tokenStorage.clear()
          setAccessToken(null)
          setSessionUser(null)
          queryClient.setQueryData(["auth", "me"], null)
        },
        hasRole(roles) {
          if (!user) return false
          return roles.includes(user.role)
        },
      }
    },
    [hasToken, meQuery.data, meQuery.isFetching, meQuery.isLoading, queryClient, sessionUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
