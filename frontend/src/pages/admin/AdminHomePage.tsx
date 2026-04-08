import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../../api/admin.api'

interface RecentUser {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  createdAt: string
}

interface AdminStats {
  users: number
  students: number
  admins: number
}

const AdminHomePage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getAdminDashboard()
        setStats(response.data.data.totals)
        setRecentUsers(response.data.data.recentUsers)
      } catch (err: unknown) {
        if (typeof err === 'object' && err && 'response' in err) {
          const maybeResponse = err as { response?: { data?: { message?: string } } }
          setError(maybeResponse.response?.data?.message || 'Failed to load admin dashboard')
        } else {
          setError('Failed to load admin dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboard()
  }, [])

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-orange-600">Admin Space</p>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Only admin users can open this route and query admin APIs.</p>
      </header>

      {loading && <p className="text-slate-600">Loading admin metrics...</p>}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.users}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.students}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Admins</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.admins}</p>
            </article>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                      <td className="py-2 pr-4">{user.name}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4 uppercase">{user.role}</td>
                      <td className="py-2">{new Date(user.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminHomePage
