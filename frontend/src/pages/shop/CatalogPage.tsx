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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })

  const products = useMemo(
    () => sortProducts(productsQuery.data ?? [], sortMode),
    [productsQuery.data, sortMode],
  )

  return (
    <section className="shop-section">
      <h1>TaskFlow Shop</h1>
      <p className="section-desc">Browse and filter our product selection</p>
      <div className="catalog-controls">
        <div className="row">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1, maxWidth: 320 }}
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
        {products.map((product, index) => (
          <article
            className="catalog-product-card"
            key={product.id}
            style={{ animationDelay: `${0.05 * index}s` }}
          >
            <div className="product-image-wrap">
              {product.image_url ? (
                <img className="product-image" src={product.image_url} alt={product.name} />
              ) : (
                <div className="product-image-placeholder">No image</div>
              )}
            </div>
            <div className="card-body">
              <h3 className="entity-title">{product.name}</h3>
              <p className="entity-description">{product.description ?? "No description"}</p>
              <p className="entity-main">{money(product.price)}</p>
              <div className="entity-meta">
                <span className="badge">Stock: {product.stock}</span>
              </div>
              <div className="catalog-product-actions">
                <Link className="button-like" to={`/shop/${product.slug}`}>
                  Details
                </Link>
                <button
                  className="btn"
                  onClick={() => addToCartMutation.mutate(product.id)}
                  disabled={addToCartMutation.isPending || product.stock < 1}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
