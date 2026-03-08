import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { categoriesApi } from "@/api"
import { getApiErrorMessage } from "@/api/error"

export default function CategoriesAdminPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const query = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list })
  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: async () => {
      setName("")
      setDescription("")
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  return (
    <section>
      <h2>Categories</h2>
      <div className="card form">
        <label className="form-field" htmlFor="category-name">
          Category name
          <input id="category-name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="form-field" htmlFor="category-description">
          Description
          <input
            id="category-description"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button
          disabled={!name.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate({ name, description: description || undefined })}
        >
          Add category
        </button>
      </div>
      {query.isLoading && <p>Loading categories...</p>}
      {query.isError && <p className="error">{getApiErrorMessage(query.error)}</p>}
      {!query.isLoading && (
        <>
          <div className="admin-list-head">
            <h3 className="admin-list-title">Categories list</h3>
            <span className="badge">Total: {(query.data ?? []).length}</span>
          </div>
          {(query.data ?? []).length === 0 ? (
            <article className="card empty-state">
              <p>No categories yet. Add one from the form above.</p>
            </article>
          ) : (
            <div className="grid admin-entity-grid">
              {(query.data ?? []).map((category) => (
                <article className="card entity-card" key={category.id}>
                  <h3 className="entity-title">{category.name}</h3>
                  <p className="entity-description">{category.description ?? "No description"}</p>
                  <div className="entity-meta">
                    <span className="badge">ID: {category.id}</span>
                  </div>
                  <button onClick={() => deleteMutation.mutate(category.id)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
