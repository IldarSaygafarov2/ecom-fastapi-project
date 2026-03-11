import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { cartApi, ordersApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"

export default function CartPage() {
  const queryClient = useQueryClient()
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
  })

  const removeMutation = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: async (_, productId) => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
    },
  })
  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
  const checkoutMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })

  if (cartQuery.isLoading) return <p>Loading cart...</p>
  if (cartQuery.isError) return <p className="error">{getApiErrorMessage(cartQuery.error)}</p>

  const cart = cartQuery.data
  if (!cart || cart.items.length === 0) {
    return (
      <section className="shop-section">
        <h1>Your cart</h1>
        <p className="section-desc">Cart is empty. Add products from the catalog.</p>
        <article className="card empty-state" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No items in your cart yet.</p>
        </article>
      </section>
    )
  }

  return (
    <section className="shop-section">
      <h1>Your cart</h1>
      <p className="section-desc">{cart.items.length} item(s) in your cart</p>
      <article className="card">
        <ul className="cart-items">
          {cart.items.map((item, index) => (
            <li key={item.id} className="cart-item" style={{ animationDelay: `${0.03 * index}s` }}>
              <span>
                Product #{item.product_id}: {item.quantity} × {money(item.price)} = {money(item.line_total)}
              </span>
              <button
                className="btn btn-danger"
                onClick={() => removeMutation.mutate(item.product_id)}
                disabled={removeMutation.isPending}
                title="Remove from cart"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <p className="cart-total">Total: {money(cart.total_amount)}</p>
      <div className="row">
        <button
          className="btn"
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
        >
          Create order
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
        >
          Clear cart
        </button>
      </div>
    </article>
    </section>
  )
}
