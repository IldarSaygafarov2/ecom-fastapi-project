import { Link, NavLink, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/auth/use-auth"

export function MainLayout() {
  const auth = useAuth()
  const isAdmin = useLocation().pathname.startsWith("/admin")
  return (
    <div className="app-shell">
      {!isAdmin && (
      <header className="topbar">
        <Link to="/" className="brand">
          TaskFlow Shop
        </Link>
        <nav>
          <NavLink to="/" end>Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/orders">Orders</NavLink>
        </nav>
        <div className="topbar-right">
          {auth.isAuthenticated ? (
            <>
              <span>{auth.user?.email}</span>
              <button className="btn btn-secondary" onClick={auth.logout}>
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
      )}
      <main className={isAdmin ? "content-full" : "content"}>
        <Outlet />
      </main>
    </div>
  )
}
