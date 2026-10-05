import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { I18nProvider, useI18n } from "./i18n/index.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";
import { LayoutThemeProvider } from "./context/LayoutThemeContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { BrandMark } from "./components/layout/Brand.jsx";
import { Spinner } from "./components/ui/index.js";

import LoginPage from "./pages/auth/LoginPage.jsx";
import LandingPage from "./pages/public/LandingPage.jsx";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/auth/PasswordPages.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import { CategoriesPage, BrandsPage, SuppliersPage, CustomersPage, BranchesPage } from "./pages/SimpleResourcePages.jsx";
import POSPage from "./pages/POSPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import KhqrPaymentsPage from "./pages/KhqrPaymentsPage.jsx";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import RolesPage from "./pages/RolesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import AIInsightsPage from "./pages/AIInsightsPage.jsx";
import EnterpriseAIDemoPage from "./pages/EnterpriseAIDemoPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { ForbiddenPage, NotFoundPage } from "./pages/ErrorPages.jsx";

function FullScreenLoader() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" role="status" aria-live="polite">
      <BrandMark size="lg" />
      <Spinner />
      <p className="text-sm text-fg-muted">{t("common.loading")}</p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <FullScreenLoader />;
  // Signed-out visitors hitting the root see the public landing page; deep links go to login and return afterwards
  if (!isAuthenticated) return location.pathname === "/" ? <Navigate to="/landing" replace /> : <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Public pages redirect signed-in users to the dashboard. */
function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

/** Permission gate — renders an in-place 403 page when access is denied. */
function Guard({ permission, children }) {
  const { can } = useAuth();
  return can(permission) ? children : <ForbiddenPage />;
}

const ROUTES = [
  { path: "products", permission: "products.view", element: <ProductsPage /> },
  { path: "categories", permission: "categories.view", element: <CategoriesPage /> },
  { path: "brands", permission: "brands.view", element: <BrandsPage /> },
  { path: "customers", permission: "customers.view", element: <CustomersPage /> },
  { path: "suppliers", permission: "suppliers.view", element: <SuppliersPage /> },
  { path: "sales", permission: "sales.view", element: <POSPage /> },
  { path: "orders", permission: "orders.view", element: <OrdersPage /> },
  { path: "khqr-payments", permission: "orders.view", element: <KhqrPaymentsPage /> },
  { path: "purchases", permission: "purchases.view", element: <PurchasesPage /> },
  { path: "inventory", permission: "inventory.view", element: <InventoryPage /> },
  { path: "expenses", permission: "expenses.view", element: <ExpensesPage /> },
  { path: "users", permission: "users.view", element: <UsersPage /> },
  { path: "roles", permission: "roles.view", element: <RolesPage /> },
  { path: "branches", permission: "branches.view", element: <BranchesPage /> },
  { path: "reports", permission: "reports.view", element: <ReportsPage /> },
  { path: "ai-insights", permission: "ai.view", element: <AIInsightsPage /> },
  { path: "enterprise-ai-demo", permission: "ai.view", element: <EnterpriseAIDemoPage /> },
  { path: "settings", permission: "settings.view", element: <SettingsPage /> },
];

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <CurrencyProvider>
            <LayoutThemeProvider>
            <HashRouter>
              <Routes>
                <Route path="/landing" element={<PublicOnly><LandingPage /></PublicOnly>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
                <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route
                    index
                    element={
                      <Guard permission="dashboard.view">
                        <DashboardPage />
                      </Guard>
                    }
                  />
                  {ROUTES.map((r) => (
                    <Route key={r.path} path={r.path} element={<Guard permission={r.permission}>{r.element}</Guard>} />
                  ))}
                  <Route path="access-denied" element={<ForbiddenPage />} />
                  <Route path="403" element={<ForbiddenPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </HashRouter>
            </LayoutThemeProvider>
            </CurrencyProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
