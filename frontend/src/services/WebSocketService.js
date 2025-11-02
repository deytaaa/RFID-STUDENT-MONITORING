import io from 'socket.io-client'

// WebSocket Service for real-time communication
class WebSocketService {
  constructor(url = 'http://localhost:3000') {
    this.url = url
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.isConnected = false
    this.isConnecting = false
  }

  connect() {
    // Prevent multiple connections
    if (this.isConnected || this.isConnecting) {
      console.log('WebSocket already connected or connecting - skipping')
      return Promise.resolve()
    }

    this.isConnecting = true
    console.log('🔌 Attempting to connect to WebSocket server...')

    try {
      this.socket = io(this.url)
      
      this.socket.on('connect', () => {
        console.log('Socket.IO connected')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emit('connected')
      })

      this.socket.on('message', (data) => {
        // Handle backend message format: { type: 'EVENT_TYPE', payload: {...} }
        if (data.type === 'GATE_STATUS_CHANGED') {
          this.emit('gate-status-changed', data.payload)
        } else if (data.type === 'SYSTEM_METRICS_UPDATED') {
          this.emit('system-status-changed', data.payload)
        } else if (data.type === 'ACCESS_ATTEMPT') {
          this.emit('access-attempt', data.payload)
        } else {
          // Generic event emission for other message types
          this.emit(data.type.toLowerCase().replace(/_/g, '-'), data.payload)
        }
      })

      // Arduino real-time events
      this.socket.on('arduino_event', (data) => {
        console.log('🤖 Arduino Event:', data)
        
        switch(data.event) {
          case 'SYSTEM_READY':
            this.emit('arduino-system-ready', data)
            break
          case 'CARD_SCANNED':
            this.emit('arduino-card-scanned', data)
            break
          case 'ACCESS_GRANTED':
            this.emit('arduino-access-granted', data)
            break
          case 'ACCESS_DENIED':
            this.emit('arduino-access-denied', data)
            break
          case 'GATE_CLOSED':
            this.emit('arduino-gate-closed', data)
            break
          default:
            this.emit('arduino-event', data)
        }
      })

      // Arduino logs
      this.socket.on('arduino_log', (data) => {
        console.log('🤖 Arduino Log:', data.message)
        this.emit('arduino-log', data)
      })

      // System status events
      this.socket.on('system_status', (data) => {
        this.emit('system-status', data)
      })

      // Gate status events  
      this.socket.on('gate_status', (data) => {
        this.emit('gate-status', data)
      })

      // Card scanned events
      this.socket.on('card_scanned', (data) => {
        this.emit('card-scanned', data)
      })

      // Access granted events
      this.socket.on('access_granted', (data) => {
        this.emit('access-granted', data)
      })

      // Access denied events
      this.socket.on('access_denied', (data) => {
        this.emit('access-denied', data)
      })

      // Student tap events (for dashboard real-time updates)
      this.socket.on('studentTap', (data) => {
        this.emit('studentTap', data)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason)
        this.isConnected = false
        this.isConnecting = false
        this.emit('disconnected')
      })

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error)
        this.isConnecting = false
        this.emit('error', error)
      })
      

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.isConnecting = false
      this.reconnect()
    }
  }

  reconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.isConnecting = false
    }
  }

  // Clear all custom event listeners
  clearListeners() {
    this.listeners.clear()
  }

  send(type, payload) {
    if (this.isConnected && this.socket) {
      this.socket.emit(type, payload)
    } else {
      console.warn('WebSocket not connected. Message not sent:', { type, payload })
    }
  }

  // Event listener methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event handler for '${event}':`, error)
        }
      })
    }
  }

  // Subscribe to specific events
  subscribeToGateStatus(callback) {
    this.on('gate-status-changed', callback)
  }

  subscribeToAccessAttempts(callback) {
    this.on('access-attempt', callback)
  }

  subscribeToSystemStatus(callback) {
    this.on('system-status-changed', callback)
  }

  subscribeToUserChanges(callback) {
    this.on('user-changed', callback)
  }

  // Unsubscribe from events
  unsubscribeFromGateStatus(callback) {
    this.off('gate-status-changed', callback)
  }

  unsubscribeFromAccessAttempts(callback) {
    this.off('access-attempt', callback)
  }

  unsubscribeFromSystemStatus(callback) {
    this.off('system-status-changed', callback)
  }

  unsubscribeFromUserChanges(callback) {
    this.off('user-changed', callback)
  }
}

export default new WebSocketService()
