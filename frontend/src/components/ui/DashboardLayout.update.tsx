  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const role = isAdmin ? 'admin' : 'student'
      const allNotifications = alertsStore.getNotificationsForRole(role)
      setNotifications(allNotifications)
    }

    loadNotifications()

    const handleExternalUpdate = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent) {
        if (event.key === alertsStore.getStorageKey()) {
          loadNotifications()
        }
      } else {
        loadNotifications()
      }
    }

    const handleVisibilityChange = () => {
      // Refresh when user comes back to the tab
      if (!document.hidden) {
        loadNotifications()
      }
    }

    window.addEventListener('storage', handleExternalUpdate)
    window.addEventListener('alerts-updated', handleExternalUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Poll for updates every 1 second to ensure real-time sync
    const pollInterval = setInterval(() => {
      loadNotifications()
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleExternalUpdate)
      window.removeEventListener('alerts-updated', handleExternalUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(pollInterval)
    }
  }, [isAdmin, refreshTick])
