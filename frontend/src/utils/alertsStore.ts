import type {
  AdminNotice,
  AlertAudience,
  AlertNotification,
  AlertPriority,
  AlertsStore,
  NotificationType,
  NoticeStatus,
} from '../types/alerts'

const ALERTS_STORAGE_KEY = 'campus-alerts-center-v1'

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const buildDefaultStore = (): AlertsStore => {
  const now = new Date().toISOString()

  return {
    notices: [
      {
        id: createId(),
        title: 'Welcome to Alerts Center',
        content: 'Admins can post notices here. Students can comment and stay updated in real time.',
        priority: 'info',
        status: 'published',
        audience: 'all',
        createdAt: now,
        updatedAt: now,
        createdById: 'system',
        createdByName: 'System',
        comments: [],
      },
    ],
    notifications: [
      {
        id: createId(),
        title: 'Order Status Updates Enabled',
        message: 'You will now receive order confirmations and payment reminders here.',
        priority: 'normal',
        type: 'order',
        audience: 'student',
        createdAt: now,
        createdById: 'system',
        createdByName: 'System',
        readByUserIds: [],
      },
    ],
  }
}

const readStore = (): AlertsStore => {
  const raw = localStorage.getItem(ALERTS_STORAGE_KEY)

  if (!raw) {
    const defaultStore = buildDefaultStore()
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(defaultStore))
    return defaultStore
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AlertsStore>
    return {
      notices: Array.isArray(parsed.notices) ? parsed.notices : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    }
  } catch {
    const defaultStore = buildDefaultStore()
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(defaultStore))
    return defaultStore
  }
}

const writeStore = (store: AlertsStore) => {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(store))
  notifyExternalUpdate()
}

// Notify other windows/tabs and same-window listeners that alerts changed
const notifyExternalUpdate = () => {
  try {
    window.dispatchEvent(new Event('alerts-updated'))
  } catch {
    // ignore in non-browser environments
  }
}

const byLatest = (a: { updatedAt?: string; createdAt: string }, b: { updatedAt?: string; createdAt: string }) => {
  const aTime = new Date(a.updatedAt || a.createdAt).getTime()
  const bTime = new Date(b.updatedAt || b.createdAt).getTime()
  return bTime - aTime
}

const canSeeAudience = (audience: AlertAudience, role: 'student' | 'admin') => {
  return audience === 'all' || audience === role
}

export const alertsStore = {
  getStorageKey() {
    return ALERTS_STORAGE_KEY
  },

  getAllNotices() {
    return readStore().notices.sort(byLatest)
  },

  getPublishedNoticesForRole(role: 'student' | 'admin') {
    return readStore().notices
      .filter((notice) => notice.status === 'published' && canSeeAudience(notice.audience, role))
      .sort(byLatest)
  },

  createNotice(input: {
    title: string
    content: string
    priority: AlertPriority
    audience: AlertAudience
    status: NoticeStatus
    createdById: string
    createdByName: string
  }) {
    const store = readStore()
    const now = new Date().toISOString()

    const nextNotice: AdminNotice = {
      id: createId(),
      title: input.title.trim(),
      content: input.content.trim(),
      priority: input.priority,
      audience: input.audience,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      createdById: input.createdById,
      createdByName: input.createdByName,
      comments: [],
    }

    store.notices = [nextNotice, ...store.notices]
    writeStore(store)
    return nextNotice
  },

  updateNotice(noticeId: string, changes: Partial<Pick<AdminNotice, 'title' | 'content' | 'priority' | 'audience' | 'status'>>) {
    const store = readStore()
    store.notices = store.notices.map((notice) => {
      if (notice.id !== noticeId) return notice

      return {
        ...notice,
        title: changes.title !== undefined ? changes.title.trim() : notice.title,
        content: changes.content !== undefined ? changes.content.trim() : notice.content,
        priority: changes.priority || notice.priority,
        audience: changes.audience || notice.audience,
        status: changes.status || notice.status,
        updatedAt: new Date().toISOString(),
      }
    })

    writeStore(store)
  },

  deleteNotice(noticeId: string) {
    const store = readStore()
    store.notices = store.notices.filter((notice) => notice.id !== noticeId)
    writeStore(store)
  },

  addComment(noticeId: string, input: { userId: string; userName: string; message: string }) {
    const store = readStore()
    const nextMessage = input.message.trim()
    if (!nextMessage) return

    store.notices = store.notices.map((notice) => {
      if (notice.id !== noticeId) return notice

      return {
        ...notice,
        comments: [
          ...notice.comments,
          {
            id: createId(),
            userId: input.userId,
            userName: input.userName,
            message: nextMessage,
            createdAt: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    })

    writeStore(store)
  },

  getNotificationsForRole(role: 'student' | 'admin') {
    return readStore().notifications
      .filter((notification) => canSeeAudience(notification.audience, role))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  sendNotification(input: {
    title: string
    message: string
    priority: AlertPriority
    type: NotificationType
    audience: AlertAudience
    createdById: string
    createdByName: string
  }) {
    const store = readStore()

    const notification: AlertNotification = {
      id: createId(),
      title: input.title.trim(),
      message: input.message.trim(),
      priority: input.priority,
      type: input.type,
      audience: input.audience,
      createdAt: new Date().toISOString(),
      createdById: input.createdById,
      createdByName: input.createdByName,
      readByUserIds: [],
    }

    store.notifications = [notification, ...store.notifications]
    writeStore(store)

    return notification
  },

  markNotificationRead(notificationId: string, userId: string) {
    const store = readStore()
    store.notifications = store.notifications.map((notification) => {
      if (notification.id !== notificationId) return notification
      if (notification.readByUserIds.includes(userId)) return notification

      return {
        ...notification,
        readByUserIds: [...notification.readByUserIds, userId],
      }
    })

    writeStore(store)
  },

  markAllNotificationsRead(userId: string, role: 'student' | 'admin') {
    const store = readStore()

    store.notifications = store.notifications.map((notification) => {
      if (!canSeeAudience(notification.audience, role)) return notification
      if (notification.readByUserIds.includes(userId)) return notification

      return {
        ...notification,
        readByUserIds: [...notification.readByUserIds, userId],
      }
    })

    writeStore(store)
  },
}
