import axios, { AxiosError } from "axios"

import { API_BASE_URL } from "@/lib/constants"
import { tokenStorage } from "@/lib/storage"
import type { TokenPair } from "@/types/api"

type RetryableRequest = {
  _retry?: boolean
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

let refreshPromise: Promise<TokenPair> | null = null

async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const response = await axios.post<TokenPair>(`${API_BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  })
  return response.data
}

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as typeof error.config & RetryableRequest
    const status = error.response?.status
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      tokenStorage.clear()
      return Promise.reject(error)
    }
    originalRequest._retry = true
    if (!refreshPromise) {
      refreshPromise = refreshTokens(refreshToken).finally(() => {
        refreshPromise = null
      })
    }
    try {
      const pair = await refreshPromise
      tokenStorage.setTokens(pair.access_token, pair.refresh_token)
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${pair.access_token}`
      }
      return http(originalRequest)
    } catch (refreshError) {
      tokenStorage.clear()
      return Promise.reject(refreshError)
    }
  },
)
