import type { ProductRead } from "@/types/api"

export type ProductSortMode = "name_asc" | "price_asc" | "price_desc" | "stock_desc"

export const PRODUCT_SORT_OPTIONS: { value: ProductSortMode; label: string }[] = [
  { value: "name_asc", label: "Sort: Name A-Z" },
  { value: "price_asc", label: "Sort: Price low to high" },
  { value: "price_desc", label: "Sort: Price high to low" },
  { value: "stock_desc", label: "Sort: Stock high to low" },
]

export function sortProducts(list: ProductRead[], mode: ProductSortMode): ProductRead[] {
  const copy = [...list]
  switch (mode) {
    case "price_asc":
      copy.sort((a, b) => Number(a.price) - Number(b.price))
      break
    case "price_desc":
      copy.sort((a, b) => Number(b.price) - Number(a.price))
      break
    case "stock_desc":
      copy.sort((a, b) => b.stock - a.stock)
      break
    default:
      copy.sort((a, b) => a.name.localeCompare(b.name))
  }
  return copy
}
