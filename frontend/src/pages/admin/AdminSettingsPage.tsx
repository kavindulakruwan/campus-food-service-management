import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type ThemeMode = 'System' | 'Light' | 'Dark'
type Language = 'English' | 'Sinhala' | 'Tamil'

interface AdminSettingsState {
  websiteName: string
  logoUrl: string
  faviconUrl: string
  systemEmail: string
  timeZone: string
  defaultLanguage: Language
  themeMode: ThemeMode
  themeColor: string
}

const storageKey = 'campusbites-admin-settings'

const defaultSettings: AdminSettingsState = {
  websiteName: 'CampusBites',
  logoUrl: '/assets/images/logo-campusbites.png',
  faviconUrl: '/favicon.ico',
  systemEmail: 'support@campusbites.com',
  timeZone: 'Asia/Colombo',
  defaultLanguage: 'English',
  themeMode: 'Light',
  themeColor: '#f97316',
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as Partial<AdminSettingsState>
      setSettings((current) => ({ ...current, ...parsed }))
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings))
  }, [settings])

  const summary = useMemo(() => {
    return `${settings.defaultLanguage} / ${settings.timeZone}`
  }, [settings])

  const toggleSetting = (key: keyof AdminSettingsState) => {
    setSettings((current) => {
      const value = current[key]
      if (typeof value === 'boolean') {
        return { ...current, [key]: !value } as AdminSettingsState
      }
      return current
    })
  }

  const updateSetting = <K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    window.localStorage.removeItem(storageKey)
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Admin Settings</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Basic system settings configured with dummy data for website setup.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetSettings}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset Defaults
          </button>
          <Link
            to="/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Admin Dashboard
          </Link>
          <Link
            to="/admin/payments"
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Payment Dashboard
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status</p>
          <p className="mt-2 text-xl font-black text-slate-900">Ready</p>
          <p className="mt-1 text-sm text-slate-500">{summary}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Website</p>
          <p className="mt-2 text-xl font-black text-slate-900">{settings.websiteName}</p>
          <p className="mt-1 text-sm text-slate-500">{settings.timeZone}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Language</p>
          <p className="mt-2 text-xl font-black text-slate-900">{settings.defaultLanguage}</p>
          <p className="mt-1 text-sm text-slate-500">System email: {settings.systemEmail}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Basic System Info</h2>
              <p className="text-sm text-slate-500">Website Name, Logo / Favicon, System Email, Time Zone, Default Language.</p>
            </div>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              Dummy Data
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">Website Name</span>
              <input
                value={settings.websiteName}
                onChange={(event) => updateSetting('websiteName', event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">System Email</span>
              <input
                value={settings.systemEmail}
                onChange={(event) => updateSetting('systemEmail', event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">Logo / Favicon</span>
              <div className="mt-3 grid gap-3">
                <input
                  value={settings.logoUrl}
                  onChange={(event) => updateSetting('logoUrl', event.target.value)}
                  placeholder="Logo URL"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
                <input
                  value={settings.faviconUrl}
                  onChange={(event) => updateSetting('faviconUrl', event.target.value)}
                  placeholder="Favicon URL"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">Time Zone</span>
              <select
                value={settings.timeZone}
                onChange={(event) => updateSetting('timeZone', event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option>Asia/Colombo</option>
                <option>Asia/Kolkata</option>
                <option>UTC</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">Default Language</span>
              <select
                value={settings.defaultLanguage}
                onChange={(event) => updateSetting('defaultLanguage', event.target.value as Language)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option>English</option>
                <option>Sinhala</option>
                <option>Tamil</option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200">
              <span className="block text-sm font-semibold text-slate-900">Theme / Color</span>
              <div className="mt-3 flex items-center gap-3">
                <select
                  value={settings.themeMode}
                  onChange={(event) => updateSetting('themeMode', event.target.value as ThemeMode)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(event) => updateSetting('themeColor', event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Quick Preview</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Website: {settings.websiteName}</p>
              <p>Logo: {settings.logoUrl}</p>
              <p>Favicon: {settings.faviconUrl}</p>
              <p>Email: {settings.systemEmail}</p>
              <p>Time Zone: {settings.timeZone}</p>
              <p>Language: {settings.defaultLanguage}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">Note</p>
            <h3 className="mt-2 text-xl font-black">Dummy Data Only</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This page is kept simple for now. It only shows the basic system info fields you asked for.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default AdminSettingsPage
