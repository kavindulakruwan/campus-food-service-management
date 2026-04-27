export type AlertPriority = 'urgent' | 'high' | 'normal' | 'info'

export type AlertAudience = 'all' | 'student' | 'admin'

export type NoticeStatus = 'published' | 'draft'

export interface NoticeComment {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

export interface AdminNotice {
  id: string
  title: string
  content: string
  priority: AlertPriority
  status: NoticeStatus
  audience: AlertAudience
  createdAt: string
  updatedAt: string
  createdById: string
  createdByName: string
  comments: NoticeComment[]
}

export type NotificationType = 'order' | 'pantry' | 'budget' | 'recommendation' | 'system'

export interface AlertNotification {
  id: string
  title: string
  message: string
  priority: AlertPriority
  type: NotificationType
  audience: AlertAudience
  createdAt: string
  createdById: string
  createdByName: string
  readByUserIds: string[]
}

export interface AlertsStore {
  notices: AdminNotice[]
  notifications: AlertNotification[]
}
