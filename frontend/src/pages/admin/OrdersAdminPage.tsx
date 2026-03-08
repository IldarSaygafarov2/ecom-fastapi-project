import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ordersApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"
import { money } from "@/lib/utils"
import type { OrderStatus } from "@/types/api"

const allStatuses: OrderStatus[] = ["pending", "paid", "shipped", "cancelled"]

export default function OrdersAdminPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["orders", "admin"], queryFn: ordersApi.list })

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })

  return (
    <section>
      <h2>Orders status</h2>
      {query.isError && <p className="error">{getApiErrorMessage(query.error)}</p>}
      {query.isLoading && <p>Loading orders...</p>}
      {!query.isLoading && (
        <>
          <div className="admin-list-head">
            <h3 className="admin-list-title">Orders list</h3>
            <span className="badge">Total: {(query.data ?? []).length}</span>
          </div>
          {(query.data ?? []).length === 0 ? (
            <article className="card empty-state">
              <p>No orders yet.</p>
            </article>
          ) : (
            <div className="grid admin-entity-grid">
              {(query.data ?? []).map((order) => (
                <article key={order.id} className="card entity-card">
                  <h3 className="entity-title">Order #{order.id}</h3>
                  <p className="entity-main">{money(order.total_amount)}</p>
                  <div className="entity-meta">
                    <span className="badge">User: {order.user_id}</span>
                    <span className="badge">Status: {order.status}</span>
                    <span className="badge">Items: {order.items.length}</span>
                  </div>
                  <div className="row admin-actions-row">
                    {allStatuses.map((status) => (
                      <button key={status} onClick={() => mutation.mutate({ orderId: order.id, status })}>
                        {status}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
