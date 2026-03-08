import { useQuery } from "@tanstack/react-query"

import { ordersApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"

export default function OrdersPage() {
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  })

  if (query.isLoading) return <p>Loading orders...</p>
  if (query.isError) return <p className="error">{getApiErrorMessage(query.error)}</p>

  const orders = query.data ?? []
  if (orders.length === 0) {
    return <p>No orders yet.</p>
  }

  return (
    <section>
      <h1>Orders</h1>
      <div className="grid">
        {orders.map((order) => (
          <article key={order.id} className="card">
            <h3>Order #{order.id}</h3>
            <p>Status: {order.status}</p>
            <p>Total: {money(order.total_amount)}</p>
            <p>Items: {order.items.length}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
