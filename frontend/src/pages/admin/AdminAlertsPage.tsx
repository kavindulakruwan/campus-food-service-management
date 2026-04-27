import { useEffect, useMemo, useState } from 'react'
import { Bell, Megaphone, Pencil, Plus, Save, Send, Trash2 } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { alertsStore } from '../../utils/alertsStore'
import type { AdminNotice, AlertAudience, AlertPriority, NotificationType, NoticeStatus } from '../../types/alerts'

interface NoticeDraft {
  title: string
  content: string
  priority: AlertPriority
  audience: AlertAudience
  status: NoticeStatus
}

interface NotificationDraft {
  title: string
  message: string
  priority: AlertPriority
  audience: AlertAudience
  type: NotificationType
}

const priorityClasses: Record<AlertPriority, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-slate-100 text-slate-700 border-slate-200',
}

const AdminAlertsPage = () => {
  const { user } = useAuth()
  const [notices, setNotices] = useState<AdminNotice[]>([])
  const [refreshTick, setRefreshTick] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noticeDraft, setNoticeDraft] = useState<NoticeDraft>({
    title: '',
    content: '',
    priority: 'normal',
    audience: 'all',
    status: 'published',
  })
  const [notificationDraft, setNotificationDraft] = useState<NotificationDraft>({
    title: '',
    message: '',
    priority: 'normal',
    audience: 'student',
    type: 'system',
  })
  const [message, setMessage] = useState('')

  const userId = user?.id || 'admin-unknown'
  const userName = user?.name || 'Admin'

  useEffect(() => {
    const load = () => {
      setNotices(alertsStore.getAllNotices())
    }

    load()

    const handleExternalUpdate = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent) {
        if (event.key === alertsStore.getStorageKey()) {
          load()
        }
      } else {
        load()
      }
    }

    window.addEventListener('storage', handleExternalUpdate)
    window.addEventListener('alerts-updated', handleExternalUpdate)
    return () => {
      window.removeEventListener('storage', handleExternalUpdate)
      window.removeEventListener('alerts-updated', handleExternalUpdate)
    }
  }, [refreshTick])

  const publishedCount = useMemo(
    () => notices.filter((notice) => notice.status === 'published').length,
    [notices],
  )

  const resetNoticeDraft = () => {
    setNoticeDraft({
      title: '',
      content: '',
      priority: 'normal',
      audience: 'all',
      status: 'published',
    })
    setEditingId(null)
  }

  const createNotice = () => {
    if (!noticeDraft.title.trim() || !noticeDraft.content.trim()) {
      setMessage('Title and content are required to create a notice.')
      return
    }

    alertsStore.createNotice({
      ...noticeDraft,
      createdById: userId,
      createdByName: userName,
    })

    setMessage('Notice created successfully.')
    resetNoticeDraft()
    setRefreshTick((previous) => previous + 1)
  }

  const startEdit = (notice: AdminNotice) => {
    setEditingId(notice.id)
    setNoticeDraft({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      audience: notice.audience,
      status: notice.status,
    })
  }

  const saveEdit = () => {
    if (!editingId) return

    if (!noticeDraft.title.trim() || !noticeDraft.content.trim()) {
      setMessage('Title and content are required to update a notice.')
      return
    }

    alertsStore.updateNotice(editingId, noticeDraft)
    setMessage('Notice updated successfully.')
    resetNoticeDraft()
    setRefreshTick((previous) => previous + 1)
  }

  const removeNotice = (noticeId: string) => {
    alertsStore.deleteNotice(noticeId)
    setMessage('Notice deleted.')
    if (editingId === noticeId) {
      resetNoticeDraft()
    }
    setRefreshTick((previous) => previous + 1)
  }

  const sendNotification = () => {
    if (!notificationDraft.title.trim() || !notificationDraft.message.trim()) {
      setMessage('Title and message are required to send a notification.')
      return
    }

    alertsStore.sendNotification({
      ...notificationDraft,
      createdById: userId,
      createdByName: userName,
    })

    setNotificationDraft({
      title: '',
      message: '',
      priority: 'normal',
      audience: 'student',
      type: 'system',
    })
    setMessage('Notification sent successfully.')
    setRefreshTick((previous) => previous + 1)
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Admin Alerts Control</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Notices and Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Publish notices, edit existing announcements, and send notification popups to users.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Total Notices</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{notices.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Published</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{publishedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Draft</p>
            <p className="mt-1 text-xl font-bold text-orange-700">{notices.length - publishedCount}</p>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Update Notice' : 'Create Notice'}
            </h2>
          </div>

          <div className="space-y-3">
            <input
              value={noticeDraft.title}
              onChange={(event) => setNoticeDraft((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Notice title"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={noticeDraft.content}
              onChange={(event) => setNoticeDraft((previous) => ({ ...previous, content: event.target.value }))}
              placeholder="Write your notice details"
              rows={5}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={noticeDraft.priority}
                onChange={(event) => setNoticeDraft((previous) => ({ ...previous, priority: event.target.value as AlertPriority }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="info">Informational</option>
              </select>

              <select
                value={noticeDraft.audience}
                onChange={(event) => setNoticeDraft((previous) => ({ ...previous, audience: event.target.value as AlertAudience }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="admin">Admins Only</option>
              </select>

              <select
                value={noticeDraft.status}
                onChange={(event) => setNoticeDraft((previous) => ({ ...previous, status: event.target.value as NoticeStatus }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {editingId ? (
                <>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Notice
                  </button>
                  <button
                    type="button"
                    onClick={resetNoticeDraft}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={createNotice}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Notice
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Send Notification Popup</h2>
          </div>

          <div className="space-y-3">
            <input
              value={notificationDraft.title}
              onChange={(event) => setNotificationDraft((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Notification title"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={notificationDraft.message}
              onChange={(event) => setNotificationDraft((previous) => ({ ...previous, message: event.target.value }))}
              placeholder="Notification message"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={notificationDraft.priority}
                onChange={(event) => setNotificationDraft((previous) => ({ ...previous, priority: event.target.value as AlertPriority }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="info">Informational</option>
              </select>

              <select
                value={notificationDraft.audience}
                onChange={(event) => setNotificationDraft((previous) => ({ ...previous, audience: event.target.value as AlertAudience }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="admin">Admins Only</option>
              </select>

              <select
                value={notificationDraft.type}
                onChange={(event) => setNotificationDraft((previous) => ({ ...previous, type: event.target.value as NotificationType }))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="order">Order</option>
                <option value="pantry">Pantry</option>
                <option value="budget">Budget</option>
                <option value="recommendation">Recommendation</option>
                <option value="system">System</option>
              </select>
            </div>

            <button
              type="button"
              onClick={sendNotification}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" />
              Send Notification
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Existing Notices</h2>
        <div className="mt-4 space-y-3">
          {notices.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No notices created yet.
            </p>
          ) : (
            notices.map((notice) => (
              <article key={notice.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{notice.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClasses[notice.priority]}`}>
                        {notice.priority}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {notice.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{notice.content}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Audience: {notice.audience} | Comments: {notice.comments.length} | Updated:{' '}
                      {new Date(notice.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(notice)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNotice(notice.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

export default AdminAlertsPage
