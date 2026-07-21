import { Route, Routes } from 'react-router-dom';
import { CustomerLayout } from './components/CustomerLayout';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminStoresPage } from './pages/AdminStoresPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuthPage } from './pages/AuthPage';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductPage } from './pages/ProductPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffMenuPage } from './pages/StaffMenuPage';
import { StaffOrdersPage } from './pages/StaffOrdersPage';
import { StaffStorePage } from './pages/StaffStorePage';

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="orders" element={<OrdersPage />} />
        </Route>
      </Route>

      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute roles={['staff']} />}>
        <Route path="staff" element={<DashboardLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="orders" element={<StaffOrdersPage />} />
          <Route path="menu" element={<StaffMenuPage />} />
          <Route path="store" element={<StaffStorePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="stores" element={<AdminStoresPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
