import { BaseModel } from './BaseModel.js'

export class AccessLogModel extends BaseModel {
  constructor() {
    super()
    this.logs = []
    this.filters = {
      status: 'all',
      dateRange: null,
      searchTerm: ''
    }
  }

  // CRUD Operations
  async getAllLogs() {
    return this.logs
  }

  async getFilteredLogs() {
    let filtered = [...this.logs]

    // Filter by status
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === this.filters.status)
    }

    // Filter by search term
    if (this.filters.searchTerm) {
      const searchTerm = this.filters.searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm) ||
        log.rfid.toLowerCase().includes(searchTerm)
      )
    }

    // Filter by date range
    if (this.filters.dateRange) {
      const { start, end } = this.filters.dateRange
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp)
        return logDate >= start && logDate <= end
      })
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  async createLog(logData) {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...logData
    }

    this.logs.unshift(newLog) // Add to beginning for newest first
    this.notifyObservers({ type: 'LOG_CREATED', log: newLog })
    return newLog
  }

  // Filter operations
  setStatusFilter(status) {
    this.filters.status = status
    this.notifyObservers({ type: 'FILTERS_CHANGED', filters: this.filters })
  }

  setSearchFilter(searchTerm) {
    this.filters.searchTerm = searchTerm
    this.notifyObservers({ type: 'FILTERS_CHANGED', filters: this.filters })
  }

  setDateRangeFilter(startDate, endDate) {
    this.filters.dateRange = startDate && endDate ? { start: startDate, end: endDate } : null
    this.notifyObservers({ type: 'FILTERS_CHANGED', filters: this.filters })
  }

  clearFilters() {
    this.filters = {
      status: 'all',
      dateRange: null,
      searchTerm: ''
    }
    this.notifyObservers({ type: 'FILTERS_CHANGED', filters: this.filters })
  }

  // Analytics
  getAccessStats(days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    )

    return {
      total: recentLogs.length,
      granted: recentLogs.filter(log => log.status === 'granted').length,
      denied: recentLogs.filter(log => log.status === 'denied').length,
      uniqueUsers: new Set(recentLogs.map(log => log.user)).size
    }
  }

  getAccessByDay(days = 7) {
    const result = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayLogs = this.logs.filter(log => {
        const logDate = new Date(log.timestamp)
        return logDate >= dayStart && logDate <= dayEnd
      })

      result.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dayStart.toISOString().split('T')[0],
        access: dayLogs.filter(log => log.status === 'granted').length,
        denied: dayLogs.filter(log => log.status === 'denied').length
      })
    }

    return result
  }

  getRecentActivity(limit = 10) {
    return this.logs
      .slice(0, limit)
      .map(log => ({
        ...log,
        timeAgo: this.getTimeAgo(log.timestamp)
      }))
  }

  // Utility methods
  getTimeAgo(timestamp) {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffMs = now - logTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  exportToCSV() {
    const headers = ['Timestamp', 'User', 'RFID', 'Status', 'Location']
    const csvContent = [
      headers.join(','),
      ...this.logs.map(log => [
        log.timestamp,
        log.user,
        log.rfid,
        log.status,
        log.location
      ].join(','))
    ].join('\n')

    return csvContent
  }
}

export default AccessLogModel
