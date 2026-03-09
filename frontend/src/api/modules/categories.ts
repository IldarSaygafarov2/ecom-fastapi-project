import { http } from "@/api/http"
import type { CategoryCreate, CategoryRead, CategoryUpdate } from "@/types/api"

export const categoriesApi = {
  list() {
    return http.get<CategoryRead[]>("/categories/").then((res) => res.data)
  },
  create(payload: CategoryCreate) {
    return http.post<CategoryRead>("/categories/", payload).then((res) => res.data)
  },
  update(categoryId: number, payload: CategoryUpdate) {
    return http.patch<CategoryRead>(`/categories/${categoryId}`, payload).then((res) => res.data)
  },
  remove(categoryId: number) {
    return http.delete(`/categories/${categoryId}`)
  },
}
