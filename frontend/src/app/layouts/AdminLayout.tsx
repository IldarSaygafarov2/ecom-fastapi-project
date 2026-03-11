import { Link, NavLink, Outlet } from "react-router-dom"

const navItems = [
  { to: "/admin/categories", label: "Categories", icon: "folder" },
  { to: "/admin/products", label: "Products", icon: "box" },
  { to: "/admin/orders", label: "Orders", icon: "clipboard" },
  { to: "/admin/users", label: "Users & Roles", icon: "users" },
] as const

function NavIcon({ icon }: { icon: string }) {
  const size = 20
  const paths: Record<string, string> = {
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  }
  return (
    <svg className="unfold-nav-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[icon] || paths.folder} />
    </svg>
  )
}

export function AdminLayout() {
  return (
    <div className="unfold-shell">
      <aside className="unfold-sidebar">
        <div className="unfold-sidebar-header">
          <span className="unfold-brand">TaskFlow Admin</span>
        </div>
        <nav className="unfold-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `unfold-nav-link ${isActive ? "active" : ""}`}>
              <NavIcon icon={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="unfold-sidebar-footer">
          <Link to="/" className="unfold-back-link">
            ← Back to shop
          </Link>
        </div>
      </aside>
      <main className="unfold-main">
        <div className="unfold-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
