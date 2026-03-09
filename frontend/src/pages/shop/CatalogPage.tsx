import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { cartApi, categoriesApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { PRODUCT_SORT_OPTIONS, sortProducts, type ProductSortMode } from "@/lib/sort"
import { money } from "@/lib/utils"

export default function CatalogPage() {
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [sortMode, setSortMode] = useState<ProductSortMode>("name_asc")
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  })
  const productsQuery = useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: () => productsApi.list({ search: search || undefined, category_id: categoryId }),
  })
  const addToCartMutation = useMutation({
    mutationFn: (productId: number) => cartApi.upsertItem({ product_id: productId, quantity: 1 }),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
    },
  })

  const products = useMemo(
    () => sortProducts(productsQuery.data ?? [], sortMode),
    [productsQuery.data, sortMode],
  )

  return (
    <section>
      <h1>Catalog</h1>
      <div className="card catalog-controls">
        <div className="row">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as ProductSortMode)}>
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="catalog-categories" role="list" aria-label="Categories">
          <button
            type="button"
            className={`category-chip ${categoryId === undefined ? "active" : ""}`}
            onClick={() => setCategoryId(undefined)}
          >
            All categories
          </button>
          {(categoriesQuery.data ?? []).map((category) => (
            <button
              type="button"
              key={category.id}
              className={`category-chip ${categoryId === category.id ? "active" : ""}`}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      {categoriesQuery.isError && <p className="error">{getApiErrorMessage(categoriesQuery.error)}</p>}
      {productsQuery.isLoading && <p className="catalog-feedback">Loading products...</p>}
      {productsQuery.isError && <p className="error catalog-feedback">{getApiErrorMessage(productsQuery.error)}</p>}
      {!productsQuery.isLoading && products.length === 0 && <p className="catalog-feedback">No products found.</p>}
      <div className="grid catalog-products-grid">
        {products.map((product) => (
          <article className="card catalog-product-card" key={product.id}>
            {product.image_url ? (
              <img className="product-image" src={product.image_url} alt={product.name} />
            ) : (
              <div className="product-image product-image-placeholder">No image</div>
            )}
            <h3 className="entity-title">{product.name}</h3>
            <p className="entity-description">{product.description ?? "No description"}</p>
            <p className="entity-main">{money(product.price)}</p>
            <div className="entity-meta">
              <span className="badge">Stock: {product.stock}</span>
            </div>
            <div className="row catalog-product-actions">
              <Link className="button-like" to={`/shop/${product.id}`}>
                Details
              </Link>
              <button
                onClick={() => addToCartMutation.mutate(product.id)}
                disabled={addToCartMutation.isPending}
              >
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
