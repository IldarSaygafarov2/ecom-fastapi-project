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
      <section className="card">
        <h1>Your cart</h1>
        <p>Cart is empty.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h1>Your cart</h1>
      <ul className="cart-items">
        {cart.items.map((item) => (
          <li key={item.id} className="cart-item">
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
      <p>Total: {money(cart.total_amount)}</p>
      <div className="row">
        <button
          className="btn"
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
        >
          Create order
        </button>
        <button
          className="btn"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
        >
          Clear cart
        </button>
      </div>
    </section>
  )
}
