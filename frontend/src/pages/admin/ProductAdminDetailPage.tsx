import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"

import { categoriesApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"
import type { CategoryRead, ProductRead } from "@/types/api"

function ProductEditForm({
  product,
  categories,
  onSaved,
  onDeleted,
}: {
  product: ProductRead
  categories: CategoryRead[]
  onSaved: () => Promise<void>
  onDeleted: () => void
}) {
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description ?? "")
  const [price, setPrice] = useState(Number(product.price))
  const [stock, setStock] = useState(product.stock)
  const [categoryId, setCategoryId] = useState(product.category_id)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const queryClient = useQueryClient()
  const updateMutation = useMutation({
    mutationFn: () =>
      productsApi.update(product.id, {
        name,
        description,
        price,
        stock,
        category_id: categoryId,
        image: imageFile,
      }),
    onSuccess: async () => {
      setImageFile(null)
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      await onSaved()
    },
  })
  const removeImageMutation = useMutation({
    mutationFn: () => productsApi.update(product.id, { remove_image: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      await onSaved()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      onDeleted()
    },
  })

  return (
    <article className="card admin-detail-card">
      {product.image_url ? (
        <img className="product-image" src={product.image_url} alt={product.name} />
      ) : (
        <div className="product-image product-image-placeholder">No image</div>
      )}
      <p className="entity-main">Current price: {money(product.price)}</p>
      <label className="form-field" htmlFor="admin-product-name">
        Product name
        <input id="admin-product-name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="form-field" htmlFor="admin-product-description">
        Description
        <input
          id="admin-product-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="form-field" htmlFor="admin-product-price">
        Price
        <input
          id="admin-product-price"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </label>
      <label className="form-field" htmlFor="admin-product-stock">
        Stock
        <input
          id="admin-product-stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
        />
      </label>
      <label className="form-field" htmlFor="admin-product-category">
        Category
        <select id="admin-product-category" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field" htmlFor="admin-product-image">
        Upload new photo
        <input
          id="admin-product-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="row admin-detail-actions">
        <button
          className="btn"
          disabled={updateMutation.isPending || !name.trim() || !categoryId}
          onClick={() => updateMutation.mutate()}
        >
          Save changes
        </button>
        {product.image_url && (
          <button className="btn" disabled={removeImageMutation.isPending} onClick={() => removeImageMutation.mutate()}>
            Remove photo
          </button>
        )}
        <button className="btn btn-danger" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
          Delete product
        </button>
      </div>
      {updateMutation.isError && <p className="error">{getApiErrorMessage(updateMutation.error)}</p>}
      {removeImageMutation.isError && <p className="error">{getApiErrorMessage(removeImageMutation.error)}</p>}
      {deleteMutation.isError && <p className="error">{getApiErrorMessage(deleteMutation.error)}</p>}
    </article>
  )
}

export default function ProductAdminDetailPage() {
  const { productId } = useParams()
  const numericId = Number(productId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const productQuery = useQuery({
    queryKey: ["product", numericId],
    queryFn: () => productsApi.get(numericId),
    enabled: Number.isFinite(numericId),
  })
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list })

  if (!Number.isFinite(numericId)) return <p className="error">Invalid product id.</p>
  if (productQuery.isLoading) return <p>Loading product...</p>
  if (productQuery.isError) return <p className="error">{getApiErrorMessage(productQuery.error)}</p>

  const product = productQuery.data
  if (!product) return <p>Product not found.</p>

  return (
    <section>
      <div className="admin-list-head">
        <h2 className="admin-list-title">Edit product #{product.id}</h2>
        <Link className="btn button-like" to="/admin/products">
          Back to products
        </Link>
      </div>
      <ProductEditForm
        key={product.id}
        product={product}
        categories={categoriesQuery.data ?? []}
        onSaved={async () => queryClient.invalidateQueries({ queryKey: ["product", numericId] })}
        onDeleted={() => navigate("/admin/products")}
      />
    </section>
  )
}
