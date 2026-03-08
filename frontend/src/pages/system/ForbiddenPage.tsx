import { Link } from "react-router-dom"

export default function ForbiddenPage() {
  return (
    <section className="card">
      <h1>403 Forbidden</h1>
      <p>You do not have enough permissions to access this page.</p>
      <Link to="/">Back home</Link>
    </section>
  )
}
