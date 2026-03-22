import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter'
    if (!/[0-9]/.test(form.password)) return 'Password must contain a number'
    if (form.password !== form.confirm) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) return setError(validationError)
    setError('')
    setLoading(true)

    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'response' in err) {
        const maybeResponse = err as { response?: { data?: { message?: string } } }
        setError(maybeResponse.response?.data?.message || 'Registration failed')
      } else {
        setError('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Create account</h2>
        <p className="mb-6 text-sm text-slate-500">Join CampusFood and start your team workflow</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Full Name',        key: 'name',     type: 'text',     placeholder: 'John Doe' },
            { label: 'Email',            key: 'email',    type: 'email',    placeholder: 'you@example.com' },
            { label: 'Password',         key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password', key: 'confirm',  type: 'password', placeholder: '••••••••' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-slate-700">{f.label}</label>
              <input
                type={f.type}
                required
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          <p className="text-xs text-slate-400">
            Password: min 8 chars, one uppercase, one number
          </p>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage