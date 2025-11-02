// Date and time utilities
export const DateUtils = {
  formatDateTime: (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  formatDate: (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  getTimeAgo: (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  },

  isToday: (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  },

  getDateRange: (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return { start, end }
  }
}

// String utilities
export const StringUtils = {
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  truncate: (str, length = 50) => {
    return str.length > length ? str.substring(0, length) + '...' : str
  },

  generateId: () => {
    return Math.random().toString(36).substr(2, 9)
  },

  maskRFID: (rfid, showLast = 4) => {
    if (!rfid || rfid.length <= showLast) return rfid
    return '*'.repeat(rfid.length - showLast) + rfid.slice(-showLast)
  },

  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}

// Validation utilities
export const ValidationUtils = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isRFID: (rfid) => {
    const rfidRegex = /^RF\d{6}$/
    return rfidRegex.test(rfid)
  },

  isPhone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/
    return phoneRegex.test(phone)
  },

  isStrongPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongRegex.test(password)
  },

  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== ''
  },

  minLength: (value, min) => {
    return value && value.length >= min
  },

  maxLength: (value, max) => {
    return !value || value.length <= max
  },

  isNumeric: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value))
  },

  isPositiveInteger: (value) => {
    return Number.isInteger(value) && value > 0
  }
}

// Local storage utilities
export const StorageUtils = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },

  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return defaultValue
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  },

  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }
}

// Export utilities
export const ExportUtils = {
  downloadCSV: (data, filename = 'export.csv') => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  },

  downloadJSON: (data, filename = 'export.json') => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  },

  arrayToCSV: (array, headers = null) => {
    if (!Array.isArray(array) || array.length === 0) {
      return ''
    }

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(array[0])
    
    // Create header row
    const headerRow = csvHeaders.join(',')
    
    // Create data rows
    const dataRows = array.map(item => 
      csvHeaders.map(header => {
        const value = item[header]
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )

    return [headerRow, ...dataRows].join('\n')
  }
}

// Color utilities
export const ColorUtils = {
  getStatusColor: (status) => {
    const colors = {
      'granted': '#10b981',
      'denied': '#ef4444',
      'pending': '#f59e0b',
      'active': '#10b981',
      'inactive': '#6b7280',
      'online': '#10b981',
      'offline': '#ef4444',
      'open': '#10b981',
      'closed': '#ef4444',
      'locked': '#f59e0b',
      'connected': '#10b981',
      'disconnected': '#ef4444',
      'operational': '#10b981',
      'maintenance': '#f59e0b',
      'error': '#ef4444'
    }
    return colors[status?.toLowerCase()] || '#6b7280'
  },

  hexToRgba: (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  },

  generateRandomColor: () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
  }
}

// Debounce utility
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
