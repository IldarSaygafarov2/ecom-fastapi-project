import { http } from "@/api/http"
import type { ProductCommentCreate, ProductCommentRead } from "@/types/api"

export const commentsApi = {
  list(productId: number) {
    return http
      .get<ProductCommentRead[]>(`/products/${productId}/comments`)
      .then((res) => res.data)
  },
  create(productId: number, payload: ProductCommentCreate) {
    return http
      .post<ProductCommentRead>(`/products/${productId}/comments`, payload)
      .then((res) => res.data)
  },
  remove(productId: number, commentId: number) {
    return http.delete(`/products/${productId}/comments/${commentId}`)
  },
}
