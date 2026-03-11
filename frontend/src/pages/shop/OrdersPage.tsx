import { useQuery } from "@tanstack/react-query"

import { ordersApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"

export default function OrdersPage() {
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  })

  if (query.isLoading) return <p className="catalog-feedback">Loading orders...</p>
  if (query.isError) return <p className="error">{getApiErrorMessage(query.error)}</p>

  const orders = query.data ?? []
  if (orders.length === 0) {
    return (
      <section className="shop-section">
        <h1>Orders</h1>
        <p className="section-desc">Your order history</p>
        <article className="card empty-state" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No orders yet.</p>
        </article>
      </section>
    )
  }

  return (
    <section className="shop-section">
      <h1>Orders</h1>
      <p className="section-desc">Your order history</p>
      <div className="grid catalog-products-grid">
        {orders.map((order, index) => (
          <article
            key={order.id}
            className="card"
            style={{
              animation: "fadeInUp 0.5s ease-out both",
              animationDelay: `${0.05 * index}s`,
            }}
          >
            <h3 className="entity-title">Order #{order.id}</h3>
            <p><span className="badge">{order.status}</span></p>
            <p className="entity-main">Total: {money(order.total_amount)}</p>
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
              {order.items.length} item(s)
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
