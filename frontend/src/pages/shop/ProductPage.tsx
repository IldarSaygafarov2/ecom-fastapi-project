import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"

import { cartApi, commentsApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { useAuth } from "@/features/auth/use-auth"
import { money } from "@/lib/utils"

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function ProductPage() {
  const { productSlug } = useParams()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [commentText, setCommentText] = useState("")

  const productQuery = useQuery({
    queryKey: ["product", productSlug],
    queryFn: () => productsApi.getBySlug(productSlug!),
    enabled: Boolean(productSlug),
  })
  const commentsQuery = useQuery({
    queryKey: ["product", productQuery.data?.id, "comments"],
    queryFn: () => commentsApi.list(productQuery.data!.id),
    enabled: Boolean(productQuery.data?.id),
  })

  const productId = productQuery.data?.id
  const createCommentMutation = useMutation({
    mutationFn: () =>
      commentsApi.create(productQuery.data!.id, { content: commentText }),
    onSuccess: () => {
      setCommentText("")
      queryClient.invalidateQueries({ queryKey: ["product", productId, "comments"] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      commentsApi.remove(productQuery.data!.id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId, "comments"] })
    },
  })

  const addToCartMutation = useMutation({
    mutationFn: () =>
      cartApi.upsertItem({ product_id: productQuery.data!.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productSlug] })
    },
  })

  if (!productSlug) {
    return <p className="error">Invalid product.</p>
  }

  if (productQuery.isLoading) {
    return <p>Loading product...</p>
  }
  if (productQuery.isError) {
    return <p className="error">{getApiErrorMessage(productQuery.error)}</p>
  }

  const product = productQuery.data
  if (!product) {
    return <p>Product not found.</p>
  }

  const comments = commentsQuery.data ?? []
  const canDelete = auth.hasRole(["admin"])

  return (
    <section className="shop-section">
      <article className="card product-detail-card">
        {product.image_url ? (
          <img className="product-image product-image-large" src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-image product-image-large product-image-placeholder">No image</div>
        )}
        <h1>{product.name}</h1>
        <p>{product.description ?? "No description"}</p>
        <p>Price: {money(product.price)}</p>
        <p>Stock: {product.stock}</p>
        <div className="row" style={{ gap: "0.75rem" }}>
          <Link className="btn btn-secondary" to="/">
            Back to products
          </Link>
          <button
            className="btn"
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending || product.stock < 1}
          >
            Add to cart
          </button>
        </div>
      </article>

      <section className="product-comments">
        <h2>Comments</h2>
        {auth.isAuthenticated && (
          <div className="card form comment-form">
            <label className="form-field" htmlFor="comment-content">
              Add a comment
              <textarea
                id="comment-content"
                rows={3}
                placeholder="Write your comment..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
            </label>
            <button
              className="btn"
              disabled={!commentText.trim() || createCommentMutation.isPending}
              onClick={() => createCommentMutation.mutate()}
            >
              Post comment
            </button>
            {createCommentMutation.isError && (
              <p className="error">{getApiErrorMessage(createCommentMutation.error)}</p>
            )}
          </div>
        )}
        {!auth.isAuthenticated && (
          <p className="comment-login-hint">
            <Link to="/login">Log in</Link> to leave a comment.
          </p>
        )}
        {commentsQuery.isLoading && <p>Loading comments...</p>}
        {!commentsQuery.isLoading && comments.length === 0 && <p>No comments yet.</p>}
        {!commentsQuery.isLoading && comments.length > 0 && (
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="card comment-card">
                <div className="comment-header">
                  <span className="comment-author">{comment.user_email}</span>
                  <span className="comment-date">{formatCommentDate(comment.created_at)}</span>
                  {canDelete && (
                    <button
                      className="comment-delete"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
