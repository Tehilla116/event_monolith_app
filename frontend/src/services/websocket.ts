/**
 * WebSocket Service for Real-time Event Updates
 * Provides a singleton WebSocket client for the frontend
 */

// WebSocket connection state
let ws: WebSocket | null = null
let isConnected = false
let reconnectAttempts = 0
let maxReconnectAttempts = 5
let reconnectTimeout: number | null = null
let heartbeatInterval: number | null = null

// Message handlers registry
type MessageHandler = (message: any) => void
const messageHandlers: MessageHandler[] = []

/**
 * Interface for WebSocket message types
 */
export interface WebSocketMessage {
  type: string
  data: any
  timestamp?: string
}

/**
 * Register a message handler
 * @param handler - Function to call when messages are received
 */
export function addMessageHandler(handler: MessageHandler): void {
  messageHandlers.push(handler)
}

/**
 * Remove a message handler
 * @param handler - Handler function to remove
 */
export function removeMessageHandler(handler: MessageHandler): void {
  const index = messageHandlers.indexOf(handler)
  if (index > -1) {
    messageHandlers.splice(index, 1)
  }
}

/**
 * Get WebSocket URL based on environment
 */
function getWebSocketUrl(): string {
  // Use VITE_API_URL if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/ws'
  }

  // Use current location for development
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }

  // Fallback for SSR or testing
  return 'ws://localhost:3001/ws'
}

/**
 * Start heartbeat ping/pong to keep connection alive
 */
function startHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }

  heartbeatInterval = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'PING' }))
      } catch (error) {
        console.error('Heartbeat ping failed:', error)
        handleConnectionError()
      }
    }
  }, 30000) // 30 seconds
}

/**
 * Stop heartbeat
 */
function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(event: MessageEvent): void {
  try {
    const message: WebSocketMessage = JSON.parse(event.data)

    // Handle system messages
    if (message.type === 'PING') {
      // Respond to server ping
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG' }))
      }
      return
    }

    if (message.type === 'PONG') {
      // Server responded to our ping - connection is alive
      return
    }

    if (message.type === 'CONNECTED') {
      console.log('✅ WebSocket connected:', message.data?.message)
      return
    }

    if (message.type === 'MESSAGE_RECEIVED') {
      // Echo response from server - ignore
      return
    }

    // Dispatch to registered handlers
    messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('Error in WebSocket message handler:', error)
      }
    })

  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

/**
 * Handle WebSocket connection open
 */
function handleOpen(): void {
  console.log('🔌 WebSocket connected - Real-time updates enabled')
  isConnected = true
  reconnectAttempts = 0

  // Start heartbeat
  startHeartbeat()
}

/**
 * Handle WebSocket connection close
 */
function handleClose(event: CloseEvent): void {
  console.warn('🔌 WebSocket disconnected:', event.code, event.reason)
  isConnected = false
  stopHeartbeat()

  // Attempt reconnection unless it was a manual close
  if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
    scheduleReconnect()
  }
}

/**
 * Handle WebSocket errors
 */
function handleError(error: Event): void {
  console.error('❌ WebSocket connection error:', error)
  handleConnectionError()
}

/**
 * Handle connection errors and schedule reconnection
 */
function handleConnectionError(): void {
  isConnected = false
  stopHeartbeat()

  if (reconnectAttempts < maxReconnectAttempts) {
    scheduleReconnect()
  } else {
    console.error('❌ Max reconnection attempts reached. Giving up.')
  }
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
  }

  reconnectAttempts++
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000) // Exponential backoff, max 30s

  console.log(`🔄 Attempting WebSocket reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms...`)

  reconnectTimeout = window.setTimeout(() => {
    connect()
  }, delay)
}

/**
 * Connect to WebSocket server
 */
export function connect(): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected')
    return
  }

  // Close existing connection if any
  disconnect()

  try {
    const wsUrl = getWebSocketUrl()
    console.log('🔌 Connecting to WebSocket:', wsUrl)

    ws = new WebSocket(wsUrl)

    ws.onopen = handleOpen
    ws.onmessage = handleMessage
    ws.onclose = handleClose
    ws.onerror = handleError

  } catch (error) {
    console.error('Error creating WebSocket connection:', error)
    handleConnectionError()
  }
}

/**
 * Disconnect from WebSocket server
 */
export function disconnect(): void {
  // Clear reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  // Stop heartbeat
  stopHeartbeat()

  // Close WebSocket connection
  if (ws) {
    ws.close(1000, 'Client disconnect')
    ws = null
  }

  isConnected = false
  reconnectAttempts = 0

  console.log('🔌 WebSocket manually disconnected')
}

/**
 * Check if WebSocket is connected
 */
export function isWebSocketConnected(): boolean {
  return isConnected && ws !== null && ws.readyState === WebSocket.OPEN
}

/**
 * Send a message through WebSocket (if available)
 * @param message - Message to send
 */
export function sendMessage(message: WebSocketMessage): boolean {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  }
  return false
}

// Export singleton instance methods
export default {
  connect,
  disconnect,
  isConnected: isWebSocketConnected,
  addMessageHandler,
  removeMessageHandler,
  sendMessage,
}