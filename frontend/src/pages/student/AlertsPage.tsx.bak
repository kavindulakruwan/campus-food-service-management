import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, Clock3, MessageSquarePlus, ShieldAlert, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { alertsStore } from '../../utils/alertsStore'
import type { AdminNotice, AlertNotification, AlertPriority } from '../../types/alerts'

const priorityLabel: Record<AlertPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  info: 'Info',
}

const priorityClasses: Record<AlertPriority, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-slate-100 text-slate-700 border-slate-200',
}

const AlertsPage = () => {
  const { user } = useAuth()
  const [notices, setNotices] = useState<AdminNotice[]>([])
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [hiddenPopupIds, setHiddenPopupIds] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | AlertPriority>('all')

  const role = user?.role === 'admin' ? 'admin' : 'student'
  const userId = user?.id || 'guest-user'
  const userName = user?.name || 'Student'

  useEffect(() => {
    const load = () => {
      setNotices(alertsStore.getPublishedNoticesForRole(role))
      setNotifications(alertsStore.getNotificationsForRole(role))
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
  }, [role])

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.readByUserIds.includes(userId)),
    [notifications, userId],
  )

  const visiblePopupNotifications = useMemo(
    () => unreadNotifications.filter((notification) => !hiddenPopupIds.includes(notification.id)).slice(0, 2),
    [hiddenPopupIds, unreadNotifications],
  )

  const filteredNotices = useMemo(() => {
    if (priorityFilter === 'all') return notices
    return notices.filter((notice) => notice.priority === priorityFilter)
  }, [notices, priorityFilter])

  const addComment = (noticeId: string) => {
    const comment = (commentDrafts[noticeId] || '').trim()
    if (!comment) return

    alertsStore.addComment(noticeId, {
      userId,
      userName,
      message: comment,
    })

    setCommentDrafts((previous) => ({ ...previous, [noticeId]: '' }))
    setNotices(alertsStore.getPublishedNoticesForRole(role))
    setStatus('Comment posted.')
  }

  const markAsRead = (notificationId: string) => {
    alertsStore.markNotificationRead(notificationId, userId)
    setNotifications(alertsStore.getNotificationsForRole(role))
  }

  const markAllAsRead = () => {
    alertsStore.markAllNotificationsRead(userId, role)
    setNotifications(alertsStore.getNotificationsForRole(role))
    setHiddenPopupIds([])
    setStatus('All notifications marked as read.')
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Alerts Center</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Notifications and Notices</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track admin notices, order/payment updates, pantry warnings, and recommendation alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all popup alerts as read
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Published Notices</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{notices.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Total Notifications</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{notifications.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Unread Popup</p>
            <p className="mt-1 text-xl font-bold text-orange-700">{unreadNotifications.length}</p>
          </div>
        </div>

        {status && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {status}
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Admin Notices</h2>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'all' | AlertPriority)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="info">Informational</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No notices match this filter.
            </p>
          ) : (
            filteredNotices.map((notice) => (
              <article key={notice.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{notice.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClasses[notice.priority]}`}>
                      {priorityLabel[notice.priority]}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Updated {new Date(notice.updatedAt).toLocaleString()}</span>
                </div>

                <p className="mt-2 text-sm text-slate-600">{notice.content}</p>

                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Comments ({notice.comments.length})
                  </p>

                  <div className="mt-2 space-y-2">
                    {notice.comments.length === 0 ? (
                      <p className="text-xs text-slate-400">No comments yet. Be the first to respond.</p>
                    ) : (
                      notice.comments.map((comment) => (
                        <div key={comment.id} className="rounded-md bg-white p-2 text-sm">
                          <p className="font-semibold text-slate-700">{comment.userName}</p>
                          <p className="text-slate-600">{comment.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={commentDrafts[notice.id] || ''}
                      onChange={(event) => {
                        setCommentDrafts((previous) => ({
                          ...previous,
                          [notice.id]: event.target.value,
                        }))
                      }}
                      placeholder="Write a comment..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addComment(notice.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notification Feed</h2>
        <div className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => {
              const isRead = notification.readByUserIds.includes(userId)

              return (
                <article key={notification.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClasses[notification.priority]}`}>
                        {priorityLabel[notification.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs uppercase text-slate-400">Type: {notification.type}</p>
                    {!isRead ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs font-semibold text-blue-600"
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600">Read</span>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      <div className="fixed bottom-4 right-4 z-40 flex w-full max-w-sm flex-col gap-2">
        {visiblePopupNotifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="mt-0.5 h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                  <p className="text-xs text-slate-500">{priorityLabel[notification.priority]} priority</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHiddenPopupIds((previous) => [...previous, notification.id])
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setHiddenPopupIds((previous) => [...previous, notification.id])
                }}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsRead(notification.id)
                  setHiddenPopupIds((previous) => [...previous, notification.id])
                }}
                className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
              >
                Mark Read
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AlertsPage
