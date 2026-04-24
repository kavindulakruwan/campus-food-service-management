import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/student/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/student/DashboardPage'
import ProfilePage from './pages/student/ProfilePage'
import MealsPage from './pages/student/MealsPage'
import MealDetailPage from './pages/student/MealDetailPage'
import MealPlannerPage from './pages/student/MealPlannerPage'
import CommunityChatPage from './pages/student/CommunityChatPage'
import MealManagementPage from './pages/student/MealManagementPage'
import FavoritesPage from './pages/student/FavoritesPage'
import PantryPage from './pages/student/PantryPage'
import AlertsPage from './pages/student/AlertsPage'
import BudgetPage from './pages/student/BudgetPage'
import RecipesPage from './pages/student/RecipesPage'
import OrdersPage from './pages/student/OrdersPage'
import PaymentsPage from './pages/student/PaymentsPage'
import CheckoutPage from './pages/student/CheckoutPage'
import DigitalReceiptPage from './pages/student/DigitalReceiptPage'
import RecommendationsPage from './pages/student/RecommendationsPage'
import AdminHomePage from './pages/admin/AdminHomePage'
import AdminMealManagementPage from './pages/admin/AdminMealManagementPage'
import AdminPaymentDashboard from './pages/admin/AdminPaymentDashboard'
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import RoleRoute from './routes/RoleRoute'
import DashboardLayout from './components/ui/DashboardLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={(
                <RoleRoute roles={['student']}>
                  <DashboardPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/profile"
              element={(
                <RoleRoute roles={['student']}>
                  <ProfilePage />
                </RoleRoute>
              )}
            />
            <Route
              path="/meals"
              element={(
                <RoleRoute roles={['student']}>
                  <MealsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/meals/:mealId"
              element={(
                <RoleRoute roles={['student']}>
                  <MealDetailPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/meal-plans"
              element={(
                <RoleRoute roles={['student']}>
                  <MealPlannerPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/community-chat"
              element={(
                <RoleRoute roles={['student']}>
                  <CommunityChatPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/meal-management"
              element={(
                <RoleRoute roles={['student']}>
                  <MealManagementPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/favorites"
              element={(
                <RoleRoute roles={['student']}>
                  <FavoritesPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/pantry"
              element={(
                <RoleRoute roles={['student']}>
                  <PantryPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/alerts"
              element={(
                <RoleRoute roles={['student']}>
                  <AlertsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/budget"
              element={(
                <RoleRoute roles={['student']}>
                  <BudgetPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/recipes"
              element={(
                <RoleRoute roles={['student']}>
                  <RecipesPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/orders"
              element={(
                <RoleRoute roles={['student']}>
                  <OrdersPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/checkout"
              element={(
                <RoleRoute roles={['student']}>
                  <CheckoutPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments"
              element={(
                <RoleRoute roles={['student']}>
                  <PaymentsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments/history"
              element={(
                <RoleRoute roles={['student']}>
                  <PaymentsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments/pending"
              element={(
                <RoleRoute roles={['student']}>
                  <PaymentsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments/paid"
              element={(
                <RoleRoute roles={['student']}>
                  <PaymentsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments/refunded"
              element={(
                <RoleRoute roles={['student']}>
                  <PaymentsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/payments/receipt/:id"
              element={(
                <RoleRoute roles={['student']}>
                  <DigitalReceiptPage />
                </RoleRoute>
              )}
            />
            <Route
              path="/recommendations"
              element={(
                <RoleRoute roles={['student']}>
                  <RecommendationsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="admin"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminHomePage />
                </RoleRoute>
              )}
            />
            <Route
              path="admin/users"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminUserManagementPage />
                </RoleRoute>
              )}
            />
            <Route
              path="admin/meal-management"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminMealManagementPage />
                </RoleRoute>
              )}
            />
            <Route
              path="admin/settings"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminSettingsPage />
                </RoleRoute>
              )}
            />
            <Route
              path="admin/payments"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminPaymentDashboard />
                </RoleRoute>
              )}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
