import { NavLink, Outlet } from "react-router-dom"

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside>
        <h3>Admin</h3>
        <nav className="admin-nav">
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/users">Users/Roles</NavLink>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  )
}
