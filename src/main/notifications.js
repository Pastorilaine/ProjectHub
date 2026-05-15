/**
 * Deadline notification checker.
 * Runs once on startup and then every hour.
 * Uses Electron's native Notification API (Windows toast / macOS banner).
 */

import { Notification } from 'electron'
import { getUpcomingDeadlineTasks } from './database'
import { getSettings } from './settings'

let timer = null
// Tracks task keys (title:due_date) already notified in this session to prevent hourly spam
const notified = new Set()

export function startDeadlineChecker() {
  // Check immediately, then every hour
  checkDeadlines()
  timer = setInterval(checkDeadlines, 60 * 60 * 1000)
}

export function stopDeadlineChecker() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function checkDeadlines() {
  const settings = getSettings()
  if (!settings.deadlineNotifications) return
  if (!Notification.isSupported()) return

  try {
    const tasks = getUpcomingDeadlineTasks(settings.notificationAdvanceHours)
    const now = Date.now()

    for (const task of tasks) {
      const key = `${task.title}:${task.due_date}`
      if (notified.has(key)) continue
      notified.add(key)

      const isOverdue = task.due_date < now

      const notification = new Notification({
        title: isOverdue
          ? `⚠️ Myöhässä: ${task.title}`
          : `🔔 Deadline tänään: ${task.title}`,
        body: `Projekti: ${task.project_name}`,
        silent: false
      })

      notification.show()
    }
  } catch (err) {
    console.error('[notifications] Deadline check failed:', err)
  }
}
