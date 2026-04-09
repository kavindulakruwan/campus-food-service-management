import { useEffect, useMemo, useState } from 'react'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  setAdminUserStatus,
  updateAdminUser,
  type AdminManagedUser,
} from '../../api/admin.api'

type RoleFilter = 'all' | 'student' | 'admin'
type StatusFilter = 'all' | 'active' | 'disabled'

const blankCreate = {
  name: '',
  email: '',
  password: '',
  role: 'student' as 'student' | 'admin',
}

const blankEdit = {
  name: '',
  email: '',
  role: 'student' as 'student' | 'admin',
  phoneNumber: '',
  bio: '',
}

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankCreate)
  const [editTarget, setEditTarget] = useState<AdminManagedUser | null>(null)
  const [editForm, setEditForm] = useState(blankEdit)
  const [resetTarget, setResetTarget] = useState<AdminManagedUser | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const activeCount = useMemo(() => users.filter((u) => u.isActive).length, [users])
  const disabledCount = useMemo(() => users.filter((u) => !u.isActive).length, [users])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getAdminUsers({
        search: query,
        role: roleFilter,
        status: statusFilter,
        page: 1,
        limit: 100,
      })
      setUsers(response.data.data.users)
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [query, roleFilter, statusFilter])

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setQuery(searchText.trim())
  }

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await createAdminUser(createForm)
      setMessage(response.data.message)
      setCreateOpen(false)
      setCreateForm(blankCreate)
      await loadUsers()
    } catch (createError: any) {
      setError(createError?.response?.data?.message || 'Failed to create user')
    }
  }

  const openEdit = (user: AdminManagedUser) => {
    setEditTarget(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
    })
  }

  const handleEditUser = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editTarget) return
    setError('')
    setMessage('')
    try {
      const response = await updateAdminUser(editTarget.id, editForm)
      setMessage(response.data.message)
      setEditTarget(null)
      await loadUsers()
    } catch (editError: any) {
      setError(editError?.response?.data?.message || 'Failed to update user')
    }
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!resetTarget) return
    setError('')
    setMessage('')

    try {
      const response = await resetAdminUserPassword(resetTarget.id, resetPassword)
      setMessage(response.data.message)
      setResetTarget(null)
      setResetPassword('')
    } catch (resetError: any) {
      setError(resetError?.response?.data?.message || 'Failed to reset password')
    }
  }

  const handleToggleStatus = async (user: AdminManagedUser) => {
    setError('')
    setMessage('')
    try {
      const response = await setAdminUserStatus(user.id, !user.isActive)
      setMessage(response.data.message)
      await loadUsers()
    } catch (statusError: any) {
      setError(statusError?.response?.data?.message || 'Failed to update account status')
    }
  }

  const handleDeleteUser = async (user: AdminManagedUser) => {
    const confirmed = window.confirm(`Delete ${user.name}? This action cannot be undone.`)
    if (!confirmed) return

    setError('')
    setMessage('')
    try {
      const response = await deleteAdminUser(user.id)
      setMessage(response.data.message)
      await loadUsers()
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 px-6 py-8 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Admin User & Profile</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">User Management Control Center</h1>
        <p className="mt-2 max-w-3xl text-sm text-cyan-100/90">
          View all users, search and filter, add or edit accounts, reset passwords, enable or disable users, and remove accounts.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Accounts</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Disabled Accounts</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{disabledCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              placeholder="Search by name or email"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <button
              type="button"
              onClick={() => setCreateOpen((value) => !value)}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              {createOpen ? 'Close Add User' : 'Add User'}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

        {createOpen && (
          <form onSubmit={handleCreateUser} className="mt-4 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 md:grid-cols-2">
            <input
              required
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Full name"
            />
            <input
              required
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Email"
            />
            <input
              required
              type="password"
              minLength={8}
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Temporary password"
            />
            <select
              value={createForm.role}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as 'student' | 'admin' }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Create User
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found for this filter</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 uppercase text-slate-600">{user.role}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetTarget(user)}
                          className="rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${user.isActive ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={handleEditUser} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
            <p className="text-sm text-slate-500">Update user account details.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                required
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Name"
              />
              <input
                required
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Email"
              />
              <select
                value={editForm.role}
                onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value as 'student' | 'admin' }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <input
                value={editForm.phoneNumber}
                onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Phone Number"
              />
              <textarea
                value={editForm.bio}
                onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
                className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                placeholder="Bio"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={handleResetPassword} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-sm text-slate-500">Set a new password for {resetTarget.name}.</p>

            <input
              required
              type="password"
              minLength={8}
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="New password"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null)
                  setResetPassword('')
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default AdminUserManagementPage