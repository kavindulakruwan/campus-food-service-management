import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const modules = [
  {
    title: 'User & Profile',
    owner: 'Member 1',
    path: '/profile',
    summary: 'Manage user access, roles, and dietary preferences.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Meal Planning',
    owner: 'Member 2',
    path: '/meal-plans',
    summary: 'Weekly schedule creation, favorites, and meal reviews.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    title: 'Pantry Alerts',
    owner: 'Member 3',
    path: '/pantry',
    summary: 'Track ingredients, set expiry alerts to reduce food waste.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Budget & Recipes',
    owner: 'Member 4',
    path: '/budget',
    summary: 'Monitor spending and collaborate on community recipes.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
]

const recentActivity = [
  { id: 1, text: 'You added a new meal to Thursday', time: '2 hours ago' },
  { id: 2, text: 'Pantry alert: Milk expires tomorrow', time: '5 hours ago' },
  { id: 3, text: 'Weekly budget reset completed', time: '1 day ago' },
]

const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-8 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold tracking-wider text-orange-400 uppercase mb-2">Workspace Overview</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Your centralized command center for campus food services. Access your team modules, track system metrics, and manage your tasks.
          </p>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none hidden sm:block">
          <svg width="404" height="384" fill="none" viewBox="0 0 404 384">
            <defs>
              <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
          </svg>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Modules Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">System Modules</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            {modules.map((module) => (
              <article 
                key={module.title} 
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${module.bg} ${module.color}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={module.icon} />
                      </svg>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                      {module.owner}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {module.summary}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    to={module.path}
                    className="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors"
                  >
                    Open Framework
                    <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar / Quick Stats */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Active Plans</span>
                <span className="text-lg font-bold text-slate-900">12</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Inventory Items</span>
                <span className="text-lg font-bold text-slate-900">148</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-600">Budget Safe</span>
                <span className="text-lg font-bold text-emerald-600">92%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">Recent Activity</h3>
            <div className="relative pl-3">
              <div className="absolute left-[3.5px] top-2 bottom-2 w-px bg-slate-200"></div>
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative pl-5">
                    <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-200"></div>
                    <p className="text-sm font-medium text-slate-800">{activity.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

export default DashboardPage
