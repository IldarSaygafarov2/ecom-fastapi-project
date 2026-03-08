import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <section className="card">
      <h1>TaskFlow eCommerce</h1>
      <p>Custom React storefront + admin panel connected to FastAPI backend.</p>
      <div className="row">
        <Link to="/shop">Open catalog</Link>
        <Link to="/admin/categories">Go to admin</Link>
      </div>
    </section>
  )
}
