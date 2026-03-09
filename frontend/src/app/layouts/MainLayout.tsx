import { Link, NavLink, Outlet } from "react-router-dom"

import { useAuth } from "@/features/auth/use-auth"

export function MainLayout() {
  const auth = useAuth()
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          TaskFlow Shop
        </Link>
        <nav>
          <NavLink to="/shop">Catalog</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          {auth.hasRole(["admin"]) && <NavLink to="/admin/categories">Admin</NavLink>}
        </nav>
        <div className="topbar-right">
          {auth.isAuthenticated ? (
            <>
              <span>{auth.user?.email}</span>
              <button className="btn" onClick={auth.logout}>
                Logout
              </button>
            </>
          ) : (
            <nav>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </nav>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
