import { http } from "@/api/http"
import type { OrderRead, OrderStatus } from "@/types/api"

export const ordersApi = {
  list() {
    return http.get<OrderRead[]>("/orders").then((res) => res.data)
  },
  create() {
    return http.post<OrderRead>("/orders").then((res) => res.data)
  },
  updateStatus(orderId: number, status: OrderStatus) {
    return http.patch<OrderRead>(`/orders/${orderId}/status`, { status }).then((res) => res.data)
  },
}
