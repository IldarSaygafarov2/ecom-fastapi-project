import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"

import { commentsApi, productsApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { useAuth } from "@/features/auth/use-auth"
import { money } from "@/lib/utils"

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function ProductPage() {
  const { productId } = useParams()
  const numericId = Number(productId)
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [commentText, setCommentText] = useState("")

  const productQuery = useQuery({
    queryKey: ["product", numericId],
    queryFn: () => productsApi.get(numericId),
    enabled: Number.isFinite(numericId),
  })
  const commentsQuery = useQuery({
    queryKey: ["product", numericId, "comments"],
    queryFn: () => commentsApi.list(numericId),
    enabled: Number.isFinite(numericId),
  })

  const createCommentMutation = useMutation({
    mutationFn: () => commentsApi.create(numericId, { content: commentText }),
    onSuccess: () => {
      setCommentText("")
      queryClient.invalidateQueries({ queryKey: ["product", numericId, "comments"] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.remove(numericId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", numericId, "comments"] })
    },
  })

  if (!Number.isFinite(numericId)) {
    return <p className="error">Invalid product id.</p>
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
    <section>
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
        <Link className="button-like" to="/shop">
          Back to catalog
        </Link>
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
