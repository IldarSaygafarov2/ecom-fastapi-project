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

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
  const checkoutMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
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
      {cart.items.map((item) => (
        <p key={item.id}>
          Product #{item.product_id}: {item.quantity} x {money(item.price)} = {money(item.line_total)}
        </p>
      ))}
      <p>Total: {money(cart.total_amount)}</p>
      <div className="row">
        <button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
          Create order
        </button>
        <button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
          Clear cart
        </button>
      </div>
    </section>
  )
}
