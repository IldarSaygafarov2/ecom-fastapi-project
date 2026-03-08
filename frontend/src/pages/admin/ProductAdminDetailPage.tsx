import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"

import { categoriesApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"

export default function ProductAdminDetailPage() {
  const { productId } = useParams()
  const numericId = Number(productId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [categoryId, setCategoryId] = useState<number>(0)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const productQuery = useQuery({
    queryKey: ["product", numericId],
    queryFn: () => productsApi.get(numericId),
    enabled: Number.isFinite(numericId),
  })
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list })

  useEffect(() => {
    const product = productQuery.data
    if (!product) return
    setName(product.name)
    setDescription(product.description ?? "")
    setPrice(Number(product.price))
    setStock(product.stock)
    setCategoryId(product.category_id)
  }, [productQuery.data])

  const updateMutation = useMutation({
    mutationFn: () =>
      productsApi.update(numericId, {
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
      await queryClient.invalidateQueries({ queryKey: ["product", numericId] })
    },
  })

  const removeImageMutation = useMutation({
    mutationFn: () => productsApi.update(numericId, { remove_image: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", numericId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(numericId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      navigate("/admin/products")
    },
  })

  if (!Number.isFinite(numericId)) return <p className="error">Invalid product id.</p>
  if (productQuery.isLoading) return <p>Loading product...</p>
  if (productQuery.isError) return <p className="error">{getApiErrorMessage(productQuery.error)}</p>

  const product = productQuery.data
  if (!product) return <p>Product not found.</p>

  return (
    <section>
      <div className="admin-list-head">
        <h2 className="admin-list-title">Edit product #{product.id}</h2>
        <Link className="button-like" to="/admin/products">
          Back to products
        </Link>
      </div>
      <article className="card admin-detail-card">
        {product.image_url ? (
          <img className="product-image" src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-image product-image-placeholder">No image</div>
        )}
        <p className="entity-main">Current price: {money(product.price)}</p>
        <label className="form-field" htmlFor="admin-product-name">
          Product name
          <input id="admin-product-name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="form-field" htmlFor="admin-product-description">
          Description
          <input
            id="admin-product-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="form-field" htmlFor="admin-product-price">
          Price
          <input
            id="admin-product-price"
            type="number"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <label className="form-field" htmlFor="admin-product-stock">
          Stock
          <input
            id="admin-product-stock"
            type="number"
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
          />
        </label>
        <label className="form-field" htmlFor="admin-product-category">
          Category
          <select id="admin-product-category" value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="row admin-detail-actions">
          <button
            disabled={updateMutation.isPending || !name.trim() || !categoryId}
            onClick={() => updateMutation.mutate()}
          >
            Save changes
          </button>
          {product.image_url && (
            <button disabled={removeImageMutation.isPending} onClick={() => removeImageMutation.mutate()}>
              Remove photo
            </button>
          )}
          <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete product
          </button>
        </div>
        {updateMutation.isError && <p className="error">{getApiErrorMessage(updateMutation.error)}</p>}
        {removeImageMutation.isError && <p className="error">{getApiErrorMessage(removeImageMutation.error)}</p>}
        {deleteMutation.isError && <p className="error">{getApiErrorMessage(deleteMutation.error)}</p>}
      </article>
    </section>
  )
}
