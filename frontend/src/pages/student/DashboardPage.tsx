import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const modules = [
  {
    title: 'User and Profile Management',
    owner: 'Member 1',
    path: '/profile',
    summary: 'Signup, login, profile CRUD, dietary preferences.',
  },
  {
    title: 'Meal Planning and Favorites',
    owner: 'Member 2',
    path: '/meal-plans',
    summary: 'Weekly planner, favorites, schedule and ratings.',
  },
  {
    title: 'Pantry and Waste Alerts',
    owner: 'Member 3',
    path: '/pantry',
    summary: 'Ingredients, quantity tracking, expiry reminders.',
  },
  {
    title: 'Budget and Recipe Sharing',
    owner: 'Member 4',
    path: '/budget',
    summary: 'Budget limits, spending reports, recipe collaboration.',
  },
]

const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-orange-600">Main Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <p className="text-slate-600">
          This page is the central workspace for your team. Each module below already has routes and starter pages,
          so teammates can begin implementation without conflicts.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <article key={module.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-500">{module.owner}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{module.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{module.summary}</p>
            <Link
              to={module.path}
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Module
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
