import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/student/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/student/DashboardPage'
import ProfilePage from './pages/student/ProfilePage'
import MealPlannerPage from './pages/student/MealPlannerPage'
import FavoritesPage from './pages/student/FavoritesPage'
import PantryPage from './pages/student/PantryPage'
import AlertsPage from './pages/student/AlertsPage'
import BudgetPage from './pages/student/BudgetPage'
import RecipesPage from './pages/student/RecipesPage'
import OrdersPage from './pages/student/OrdersPage'
import PaymentsPage from './pages/student/PaymentsPage'
import RecommendationsPage from './pages/student/RecommendationsPage'
import AdminHomePage from './pages/admin/AdminHomePage'
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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/meal-plans" element={<MealPlannerPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/pantry" element={<PantryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route
              path="admin"
              element={(
                <RoleRoute roles={['admin']}>
                  <AdminHomePage />
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
