import { http } from "@/api/http"
import type { ProductCreate, ProductRead, ProductUpdate } from "@/types/api"

interface ProductQuery {
  search?: string
  category_id?: number
}

export const productsApi = {
  list(params?: ProductQuery) {
    return http.get<ProductRead[]>("/products", { params }).then((res) => res.data)
  },
  get(productId: number) {
    return http.get<ProductRead>(`/products/${productId}`).then((res) => res.data)
  },
  create(payload: ProductCreate) {
    const formData = new FormData()
    formData.append("name", payload.name)
    formData.append("price", String(payload.price))
    formData.append("stock", String(payload.stock))
    formData.append("category_id", String(payload.category_id))
    if (payload.description) {
      formData.append("description", payload.description)
    }
    if (payload.image) {
      formData.append("image", payload.image)
    }
    return http
      .post<ProductRead>("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data)
  },
  update(productId: number, payload: ProductUpdate) {
    const formData = new FormData()
    if (payload.name !== undefined) {
      formData.append("name", payload.name)
    }
    if (payload.description !== undefined && payload.description !== null) {
      formData.append("description", payload.description)
    }
    if (payload.price !== undefined) {
      formData.append("price", String(payload.price))
    }
    if (payload.stock !== undefined) {
      formData.append("stock", String(payload.stock))
    }
    if (payload.category_id !== undefined) {
      formData.append("category_id", String(payload.category_id))
    }
    if (payload.image) {
      formData.append("image", payload.image)
    }
    if (payload.remove_image) {
      formData.append("remove_image", "true")
    }
    return http
      .patch<ProductRead>(`/products/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data)
  },
  remove(productId: number) {
    return http.delete(`/products/${productId}`)
  },
}
