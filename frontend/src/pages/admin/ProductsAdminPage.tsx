import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { categoriesApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { PRODUCT_SORT_OPTIONS, sortProducts, type ProductSortMode } from "@/lib/sort"
import { money } from "@/lib/utils"

export default function ProductsAdminPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [categoryId, setCategoryId] = useState<number>(0)
  const [search, setSearch] = useState("")
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined)
  const [sortMode, setSortMode] = useState<ProductSortMode>("name_asc")
  const [photoFileById, setPhotoFileById] = useState<Record<number, File | null>>({})

  const productsQuery = useQuery({ queryKey: ["products", "admin"], queryFn: () => productsApi.list() })
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list })
  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  )
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = (productsQuery.data ?? []).filter((product) => {
      const byCategory = filterCategoryId ? product.category_id === filterCategoryId : true
      const bySearch = normalizedSearch ? product.name.toLowerCase().includes(normalizedSearch) : true
      return byCategory && bySearch
    })
    return sortProducts(filtered, sortMode)
  }, [productsQuery.data, filterCategoryId, search, sortMode])

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: async () => {
      setName("")
      setImageFile(null)
      setPrice(0)
      setStock(0)
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ productId, image, remove_image }: { productId: number; image?: File | null; remove_image?: boolean }) =>
      productsApi.update(productId, { image, remove_image }),
    onSuccess: async () => {
      setPhotoFileById({})
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  return (
    <section>
      <h2>Products</h2>
      <div className="card form">
        <label className="form-field" htmlFor="product-name">
          Product name
          <input id="product-name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="form-field" htmlFor="product-price">
          Price
          <input
            id="product-price"
            placeholder="Price"
            type="number"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <label className="form-field" htmlFor="product-image-file">
          Product photo
          <input
            id="product-image-file"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="form-field" htmlFor="product-stock">
          Stock
          <input
            id="product-stock"
            placeholder="Stock"
            type="number"
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
          />
        </label>
        <label className="form-field" htmlFor="product-category">
          Category
          <select id="product-category" value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>
            <option value={0}>Select category</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn"
          disabled={!name.trim() || !categoryId}
          onClick={() =>
            createMutation.mutate({
              name,
              image: imageFile,
              price,
              stock,
              category_id: categoryId,
            })
          }
        >
          Add product
        </button>
      </div>
      {productsQuery.isError && <p className="error">{getApiErrorMessage(productsQuery.error)}</p>}
      {productsQuery.isLoading && <p>Loading products...</p>}
      {!productsQuery.isLoading && (
        <>
          <div className="admin-list-head">
            <h3 className="admin-list-title">Products list</h3>
            <span className="badge">Total: {filteredProducts.length}</span>
          </div>
          <div className="card catalog-controls admin-list-controls">
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
            <div className="catalog-categories" role="list" aria-label="Filter by category">
              <button
                type="button"
                className={`category-chip ${filterCategoryId === undefined ? "active" : ""}`}
                onClick={() => setFilterCategoryId(undefined)}
              >
                All categories
              </button>
              {(categoriesQuery.data ?? []).map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`category-chip ${filterCategoryId === category.id ? "active" : ""}`}
                  onClick={() => setFilterCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <article className="card empty-state">
              <p>No products match current filters.</p>
            </article>
          ) : (
            <div className="grid admin-entity-grid">
              {filteredProducts.map((product) => (
                <article className="card entity-card" key={product.id}>
                  {product.image_url ? (
                    <img className="product-image" src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="product-image product-image-placeholder">No image</div>
                  )}
                  <h3 className="entity-title">{product.name}</h3>
                  <p className="entity-main">{money(product.price)}</p>
                  <div className="entity-meta">
                    <span className="badge">ID: {product.id}</span>
                    <span className="badge">Stock: {product.stock}</span>
                    <span className="badge">Category: {categoryNameById.get(product.category_id) ?? "Unknown"}</span>
                  </div>
                  <Link className="button-like" to={`/admin/products/${product.id}`}>
                    Edit details
                  </Link>
                  <label className="form-field" htmlFor={`photo-file-${product.id}`}>
                    Update product photo
                    <input
                      id={`photo-file-${product.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setPhotoFileById((prev) => ({ ...prev, [product.id]: event.target.files?.[0] ?? null }))
                      }
                    />
                  </label>
                  <button
                    disabled={!photoFileById[product.id]}
                    onClick={() =>
                      updateMutation.mutate({
                        productId: product.id,
                        image: photoFileById[product.id],
                      })
                    }
                  >
                    Save photo
                  </button>
                  {product.image_url && (
                    <button onClick={() => updateMutation.mutate({ productId: product.id, remove_image: true })}>
                      Remove photo
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => deleteMutation.mutate(product.id)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
