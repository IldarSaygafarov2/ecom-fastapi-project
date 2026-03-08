import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <section className="card">
      <h1>404 Not found</h1>
      <p>Requested page does not exist.</p>
      <Link to="/">Back home</Link>
    </section>
  )
}
