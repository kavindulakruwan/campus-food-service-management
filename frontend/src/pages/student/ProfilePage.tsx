import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Loader2, Mail, Phone, ShieldAlert, User, Trash2, RotateCcw, Save } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { deleteMyAccount, getMyProfile, updateMyProfile } from '../../api/user.api'
import type { AuthUser } from '../../types/auth'
import { useNavigate } from 'react-router-dom'

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<AuthUser | null>(user)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getMyProfile()
        const nextProfile = response.data.user
        setProfile(nextProfile)
        setName(nextProfile.name || '')
        setEmail(nextProfile.email || '')
        setPhoneNumber(nextProfile.phoneNumber || '')
        setBio(nextProfile.bio || '')
        setAvatarUrl(nextProfile.avatarUrl || '')
        setPreviewUrl(nextProfile.avatarUrl || '')
        setError('')
        updateUser(nextProfile)
      } catch (profileError: any) {
        setError(profileError?.response?.data?.message || 'Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [updateUser])

  const initials = useMemo(() => (name || profile?.name || 'User').slice(0, 1).toUpperCase(), [name, profile?.name])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setAvatarUrl(result)
      setPreviewUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    setName(profile?.name || '')
    setEmail(profile?.email || '')
    setPhoneNumber(profile?.phoneNumber || '')
    setBio(profile?.bio || '')
    setAvatarUrl(profile?.avatarUrl || '')
    setPreviewUrl(profile?.avatarUrl || '')
    setError('')
    setMessage('')
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateMyProfile({
        name,
        email,
        phoneNumber,
        bio,
        avatarUrl,
      })

      const updatedUser = response.data.user
      setProfile(updatedUser)
      updateUser(updatedUser)
      setMessage(response.data.message)
    } catch (profileError: any) {
      setError(profileError?.response?.data?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete your account permanently? This cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    try {
      await deleteMyAccount()
      await logout()
      navigate('/register', { replace: true })
    } catch (profileError: any) {
      setError(profileError?.response?.data?.message || 'Unable to delete account')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-orange-100/80">User Management</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Profile, access, and account control</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100/90 sm:text-base">
              Keep your campus identity current, manage your personal details, and control your account security from one place.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/15">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{initials}</span>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold">{name || profile?.name || 'Student profile'}</p>
                <p className="text-sm text-orange-100/80">{email || profile?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">Loading profile...</div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Profile Details</h2>
                <p className="text-sm text-slate-500">Update your name, contact details, and profile photo.</p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <ShieldAlert className="h-4 w-4" /> Secure access enabled
              </div>
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Full Name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white"
                    placeholder="Your full name"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email Address</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white"
                    placeholder="your@email.com"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Phone Number</span>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white"
                    placeholder="07X XXX XXXX"
                  />
                </div>
              </label>

              <div className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Short Bio / Details</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white"
                  placeholder="Tell classmates about your food preferences, campus role, or recovery details."
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              <label className="space-y-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Camera className="h-4 w-4 text-orange-600" /> Profile Photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
                />
                <p className="text-xs text-slate-500">The image is stored as a profile preview and saved with your account.</p>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Account Recovery Options</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Password reset through your registered email address</li>
                  <li>• Contact admin support if access is lost</li>
                  <li>• Keep your phone number updated for identity checks</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" /> Reset changes
              </button>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Trash2 className="h-4 w-4" /> Delete account
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Account summary</h3>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold capitalize text-slate-700">{profile?.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email verification</span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">Manual</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">What this module covers</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Student registration and secure login</li>
                <li>• Profile update with name, email, phone, bio, and photo</li>
                <li>• Account deletion from the profile screen</li>
                <li>• Recovery guidance for forgotten access</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                  {previewUrl ? <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-lg font-bold text-slate-500">{initials}</div>}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{name || profile?.name || 'Your name'}</p>
                  <p className="text-sm text-slate-500">{phoneNumber || 'Phone number not set'}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default ProfilePage