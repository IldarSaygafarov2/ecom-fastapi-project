import { http } from "@/api/http"
import type { CartRead } from "@/types/api"

interface CartItemUpsert {
  product_id: number
  quantity: number
}

export const cartApi = {
  get() {
    return http.get<CartRead>("/cart/").then((res) => res.data)
  },
  upsertItem(payload: CartItemUpsert) {
    return http.put<CartRead>("/cart/items", payload).then((res) => res.data)
  },
  removeItem(productId: number) {
    return http.delete<CartRead>(`/cart/items/${productId}`).then((res) => res.data)
  },
  clear() {
    return http.delete("/cart/")
  },
}
