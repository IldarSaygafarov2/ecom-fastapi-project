import { Suspense, lazy, type ReactNode } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"

import { AdminLayout } from "@/app/layouts/AdminLayout"
import { MainLayout } from "@/app/layouts/MainLayout"
import { RequireAuth, RequireRole } from "@/features/auth/guards"

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"))
const CatalogPage = lazy(() => import("@/pages/shop/CatalogPage"))
const ProductPage = lazy(() => import("@/pages/shop/ProductPage"))
const CartPage = lazy(() => import("@/pages/shop/CartPage"))
const OrdersPage = lazy(() => import("@/pages/shop/OrdersPage"))
const AdminCategoriesPage = lazy(() => import("@/pages/admin/CategoriesAdminPage"))
const AdminProductsPage = lazy(() => import("@/pages/admin/ProductsAdminPage"))
const AdminProductDetailPage = lazy(() => import("@/pages/admin/ProductAdminDetailPage"))
const AdminOrdersPage = lazy(() => import("@/pages/admin/OrdersAdminPage"))
const AdminUsersPage = lazy(() => import("@/pages/admin/UsersAdminPage"))
const ForbiddenPage = lazy(() => import("@/pages/system/ForbiddenPage"))
const NotFoundPage = lazy(() => import("@/pages/system/NotFoundPage"))

function withFallback(node: ReactNode) {
  return <Suspense fallback={<p>Loading page...</p>}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: withFallback(<CatalogPage />) },
      { path: "shop", element: <Navigate to="/" replace /> },
      { path: "shop/:productSlug", element: withFallback(<ProductPage />) },
      { path: "login", element: withFallback(<LoginPage />) },
      { path: "register", element: withFallback(<RegisterPage />) },
      { path: "403", element: withFallback(<ForbiddenPage />) },
      {
        element: <RequireAuth />,
        children: [
          { path: "cart", element: withFallback(<CartPage />) },
          { path: "orders", element: withFallback(<OrdersPage />) },
        ],
      },
      {
        path: "admin",
        element: <RequireAuth />,
        children: [
          {
            element: <RequireRole roles={["admin"]} />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to="/admin/categories" replace /> },
                  { path: "categories", element: withFallback(<AdminCategoriesPage />) },
                  { path: "products", element: withFallback(<AdminProductsPage />) },
                  { path: "products/:productId", element: withFallback(<AdminProductDetailPage />) },
                  { path: "orders", element: withFallback(<AdminOrdersPage />) },
                  { path: "users", element: withFallback(<AdminUsersPage />) },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: withFallback(<NotFoundPage />) },
    ],
  },
])
