import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { useEffect, useRef, useState } from 'react'

const studentLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Meals', path: '/meals', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Meal Planner', path: '/meal-plans', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Meal Management', path: '/meal-management', icon: 'M4 6h16M4 12h16M4 18h10' },
  { label: 'Community Chat', path: '/community-chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Favorites', path: '/favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { label: 'Pantry', path: '/pantry', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Alerts', path: '/alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { label: 'Budget', path: '/budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Recipes', path: '/recipes', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Orders', path: '/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Payments', path: '/payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Recommendations', path: '/recommendations', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
]

const adminLinks = [
  { label: 'Dashboard', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Users', path: '/admin/users', icon: 'M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-5a4 4 0 11-8 0 4 4 0 018 0zM9 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Meals', path: '/admin/meal-management', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Payments', path: '/admin/payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Settings', path: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('campus-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem('campus-theme', theme)
  }, [theme])

  const visibleLinks = isAdmin ? adminLinks : studentLinks
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetActivityTimeout = () => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }
    activityTimeoutRef.current = setTimeout(() => {
      setIsSidebarVisible(false)
    }, 15000)
  }

  useEffect(() => {
    // Start timeout on initial load or path change
    resetActivityTimeout()

    const handleUserActivity = () => {
      resetActivityTimeout()
    }

    window.addEventListener('mousemove', handleUserActivity)
    window.addEventListener('keydown', handleUserActivity)
    window.addEventListener('click', handleUserActivity)
    window.addEventListener('scroll', handleUserActivity)

    return () => {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
      window.removeEventListener('mousemove', handleUserActivity)
      window.removeEventListener('keydown', handleUserActivity)
      window.removeEventListener('click', handleUserActivity)
      window.removeEventListener('scroll', handleUserActivity)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const currentLink = visibleLinks.find((l) => location.pathname.startsWith(l.path))
  const pageTitle = currentLink ? currentLink.label : 'Application'
  const pagePath = location.pathname.split('/').filter(Boolean).join(' / ') || 'dashboard'

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans antialiased text-slate-900">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Invisible trigger area for desktop right on the left edge - Made wider (128px) so it's easier to trigger */}
      {!isSidebarVisible && (
        <div 
          className="fixed inset-y-0 left-0 w-16 z-60 hidden lg:block bg-transparent"
          onMouseEnter={() => {
            setIsSidebarVisible(true)
            resetActivityTimeout()
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 shadow-[0_0_0_1px_rgba(15,23,42,0.02)] ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarVisible ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md shadow-orange-300/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
               <line x1="6" x2="18" y1="17" y2="17"/>
            </svg>
          </div>
          <span className="text-[1.1rem] font-extrabold tracking-tight text-slate-700">Campus<span className="text-orange-500">Bites</span></span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Navigation
          </div>
          <nav className="flex flex-col gap-1.5">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsSidebarVisible(false)
                }}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-1 ring-1 ring-orange-400/20'
                      : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                    </svg>
                    {link.label}
                  </>
                )}
              </NavLink>
              ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4 bg-white">
          <button
            type="button"
            onClick={() => navigate(isAdmin ? '/admin/settings' : '/profile')}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#Fdfbf7] p-3 text-left shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 cursor-pointer"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-extrabold text-orange-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-bold text-slate-700">{user?.name}</p>
              <p className="truncate text-xs font-semibold text-slate-400 capitalize">{isAdmin ? 'Admin Settings' : 'Profile'}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-600">
              Open
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${isSidebarVisible ? 'lg:ml-72' : 'lg:ml-0'}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="-ml-1 p-1 text-slate-500 hover:text-slate-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="hidden text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:block">
                CampusBites / {pagePath}
              </p>
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-800">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
                </svg>
              )}
            </button>

            <div className="h-6 w-px bg-slate-200" />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Log out
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8 relative">
          <div className="min-h-full w-full flex flex-col">
            <div className="flex-1 mb-10">
              <Outlet />
            </div>

            {/* Custom Footer inside main area */}
            <footer className="mt-auto border-t border-slate-200 pt-6 pb-2">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} Campus Food Service Management. All rights reserved.</p>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-slate-900 transition hover:underline">Privacy Policy</a>
                  <a href="#" className="hover:text-slate-900 transition hover:underline">Terms of Service</a>
                  <a href="#" className="hover:text-slate-900 transition hover:underline">Support</a>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
