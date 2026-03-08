export type UserRole = "admin" | "customer"
export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled"

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserRead {
  id: number
  email: string
  full_name: string | null
  role: UserRole
}

export interface CategoryRead {
  id: number
  name: string
  description: string | null
}

export interface CategoryCreate {
  name: string
  description?: string | null
}

export interface CategoryUpdate {
  name?: string
  description?: string | null
}

export interface ProductRead {
  id: number
  name: string
  description: string | null
  image_url: string | null
  price: string
  stock: number
  category_id: number
}

export interface ProductCreate {
  name: string
  description?: string | null
  image?: File | null
  price: number
  stock: number
  category_id: number
}

export interface ProductUpdate {
  name?: string
  description?: string | null
  image?: File | null
  remove_image?: boolean
  price?: number
  stock?: number
  category_id?: number
}

export interface CartItemRead {
  id: number
  product_id: number
  quantity: number
  price: string
  line_total: string
}

export interface CartRead {
  id: number
  user_id: number
  items: CartItemRead[]
  total_amount: string
}

export interface OrderItemRead {
  product_id: number
  quantity: number
  price: string
}

export interface OrderRead {
  id: number
  user_id: number
  status: OrderStatus
  total_amount: string
  items: OrderItemRead[]
}

export interface ProductCommentRead {
  id: number
  product_id: number
  user_id: number
  user_email: string
  content: string
  created_at: string
}

export interface ProductCommentCreate {
  content: string
}
