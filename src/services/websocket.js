const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second
  }

  connect(namespace = '/partner', token = null) {
    if (this.socket) return;

    const authToken = token || localStorage.getItem('partnerToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!authToken) {
      console.error('No authentication token found');
      return;
    }

    this.socket = new WebSocket(`${WS_URL}${namespace}?token=${authToken}`);

    this.socket.onopen = () => {
      console.log('WebSocket Connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageListeners.forEach(listener => listener(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket Disconnected');
      this.socket = null;
      this.attemptReconnect();
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onMessage(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  sendMessage(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  emit(event, data) {
    this.sendMessage({ type: event, data });
  }

  on(event, callback) {
    // For compatibility with socket.io-like API
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  off(event, callback) {
    this.messageListeners.delete(callback);
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }
}

export const webSocketService = new WebSocketService();

// Initialize WebSocket connection when the service is imported
if (typeof window !== 'undefined') {
  webSocketService.connect();
}