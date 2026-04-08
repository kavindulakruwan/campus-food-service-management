import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Meal Planner', path: '/meal-plans' },
  { label: 'Favorites', path: '/favorites' },
  { label: 'Pantry', path: '/pantry' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Budget', path: '/budget' },
  { label: 'Recipes', path: '/recipes' },
  { label: 'Orders', path: '/orders' },
  { label: 'Payments', path: '/payments' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'Admin', path: '/admin', adminOnly: true },
]

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-orange-600">Campus Food Service</p>
            <h1 className="text-lg font-semibold text-slate-900">Team Workspace</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <p className="text-xs uppercase text-slate-500">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="grid gap-1">
            {links
              .filter((link) => !link.adminOnly || user?.role === 'admin')
              .map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
              ))}
          </nav>
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
