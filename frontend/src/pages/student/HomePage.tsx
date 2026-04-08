import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-white">

      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-orange-600">CampusFood</h1>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">
            Login
          </Link>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Create Account'}
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-10 text-center sm:px-6 lg:px-8">
        <p className="mb-4 rounded-full border border-orange-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
          Campus Food and Meal Planning
        </p>
        <h2 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl">
          One Main Platform For Student Meals, Budgeting, Pantry, And Recipes
        </h2>
        <p className="mb-8 max-w-3xl text-slate-600">
          This scaffold is now organized into 4 independent team modules: User Management,
          Meal Planning and Favorites, Pantry and Waste Alerts, Budget and Recipe Sharing.
          Your teammates can start coding directly inside dedicated pages and routes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            {isAuthenticated ? 'Go To Dashboard' : 'Start With Signup'}
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Explore All Module Pages
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        {[
          {
            title: 'Member 1: User and Profile Management',
            desc: 'Signup, login, profile CRUD, dietary preferences, account controls.',
          },
          {
            title: 'Member 2: Meal Planning and Favorites',
            desc: 'Weekly planning, meal scheduling, dining favorites, ratings and notes.',
          },
          {
            title: 'Member 3: Pantry and Waste Alerts',
            desc: 'Ingredient tracking, quantities, expiry dates, reminder alerts.',
          },
          {
            title: 'Member 4: Budget and Recipe Sharing',
            desc: 'Budget limits, spending analytics, recipe upload, browsing and edits.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="pb-8 text-center text-sm text-slate-500">
        © 2026 CampusFood. All rights reserved.
      </footer>
    </div>
  )
}

export default HomePage