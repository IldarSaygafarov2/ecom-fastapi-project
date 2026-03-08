import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getApiErrorMessage } from "@/api/error"
import { usersApi } from "@/api/modules/users"
import type { UserRole } from "@/types/api"

const roles: UserRole[] = ["admin", "customer"]

export default function UsersAdminPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["users"], queryFn: usersApi.list })
  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) => usersApi.updateRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  return (
    <section>
      <h2>Users and roles</h2>
      {query.isError && <p className="error">{getApiErrorMessage(query.error)}</p>}
      {query.isLoading && <p>Loading users...</p>}
      {!query.isLoading && (
        <>
          <div className="admin-list-head">
            <h3 className="admin-list-title">Users list</h3>
            <span className="badge">Total: {(query.data ?? []).length}</span>
          </div>
          {(query.data ?? []).length === 0 ? (
            <article className="card empty-state">
              <p>No users found.</p>
            </article>
          ) : (
            <div className="grid admin-entity-grid">
              {(query.data ?? []).map((user) => (
                <article className="card entity-card user-card" key={user.id}>
                  <h3 className="entity-title user-email">{user.email}</h3>
                  <div className="entity-meta">
                    <span className="badge">ID: {user.id}</span>
                    <span className="badge">Role: {user.role}</span>
                  </div>
                  <div className="row admin-actions-row">
                    {roles.map((role) => (
                      <button key={role} onClick={() => mutation.mutate({ userId: user.id, role })}>
                        Set {role}
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
