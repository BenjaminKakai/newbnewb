// /home/benjamin/wasaa-web-service/src/services/authSocketService.js
import io from 'socket.io-client';

class AuthSocketService {
  constructor() {
    this.TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;
    this.MAX_RETRIES = 3;
    this.API_KEY = 'QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==';
    this.API_ENDPOINTS = {
      USER_SERVICE: process.env.REACT_APP_USER_SERVICE_URL || 'http://138.68.190.213:3010',
      CONTACTS: process.env.REACT_APP_CONTACTS_API || 'http://138.68.190.213:3019',
      CALLS: process.env.REACT_APP_CALLS_API || 'https://calls-dev.wasaachat.com:3000',
      SOCKET: process.env.REACT_APP_SOCKET_URL || 'https://calls-dev.wasaachat.com:9638',
      AUTH_REFRESH: '/api/auth/refresh',
    };
    this.socket = null;
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.isInitializingSocket = false;
  }

  getTokenPayload(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  shouldRefreshToken(token) {
    if (!token) return true;
    const payload = this.getTokenPayload(token);
    if (!payload) return true;
    const expiryTime = payload.exp * 1000;
    return expiryTime - Date.now() < this.TOKEN_REFRESH_THRESHOLD;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.handleLogout();
      return null;
    }

    try {
      const response = await fetch(this.API_ENDPOINTS.AUTH_REFRESH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { token: newToken } = await response.json();
        localStorage.setItem('token', newToken);
        return newToken;
      } else {
        console.error('Token refresh failed:', await response.text());
        this.handleLogout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error.message);
      this.handleLogout();
      return null;
    }
  }

  async ensureValidToken() {
    let token = localStorage.getItem('token');
    if (!token || this.shouldRefreshToken(token)) {
      console.log('Token missing or needs refresh');
      token = await this.refreshToken();
      if (!token) {
        console.error('Failed to refresh token');
        this.handleLogout();
        throw new Error('No valid token');
      }
    }
    return token;
  }

  async checkServiceAvailability(endpoint) {
    try {
      const response = await fetch(endpoint, { method: 'HEAD', mode: 'no-cors' });
      return response.ok || response.type === 'opaque';
    } catch {
      return false;
    }
  }

  async fetchWithRetry(url, options = {}, retries = this.MAX_RETRIES) {
    if (!(await this.checkServiceAvailability(url))) {
      throw new Error(`Service at ${url} is unavailable`);
    }

    for (let i = 0; i < retries; i++) {
      try {
        const token = await this.ensureValidToken();
        if (!token) {
          throw new Error('Authentication failed: No valid token');
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.API_KEY,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) return response;
        if (response.status === 401) {
          if (i === retries - 1) {
            this.handleLogout();
            throw new Error('Authentication failed: Token invalid or expired');
          }
          await this.refreshToken();
          continue;
        }

        if (i === retries - 1) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async makeApiCall(service, endpoint = '', options = {}) {
    const url = `${this.API_ENDPOINTS[service.toUpperCase()]}${endpoint}`;
    try {
      const response = await this.fetchWithRetry(url, options);
      return await response.json();
    } catch (error) {
      console.error(`API call to ${url} failed:`, error.message);
      throw new Error(`Failed to connect to ${service}. ${error.message}`);
    }
  }

  async initializeSocket(userId) {
    if (this.isInitializingSocket) return;
    this.isInitializingSocket = true;
    try {
      if (this.socket) this.socket.disconnect();
      const token = await this.ensureValidToken();
      console.log('Socket token:', token);
      this.socket = io(this.API_ENDPOINTS.SOCKET, {
        path: '/socket.io',
        auth: {
          token,
          userId,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log(`Socket connected: ${this.socket.id}`);
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', async (error) => {
        console.error('Socket error:', error.message);
        if (error.message.includes('Authentication') && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          await this.refreshToken();
          this.reconnectSocket(userId);
        } else {
          this.handleLogout();
        }
      });

      this.socket.on('error', (data) => {
        console.error(`Server error: ${JSON.stringify(data)}`);
      });

      this.socket.on('disconnect', () => {
        console.warn('Socket disconnected');
        this.reconnectSocket(userId);
      });
    } catch (error) {
      console.error('Socket init failed:', error.message);
      this.reconnectSocket(userId);
    } finally {
      this.isInitializingSocket = false;
    }
  }

  async reconnectSocket(userId) {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max socket reconnect attempts reached');
      this.handleLogout();
      return;
    }

    this.reconnectAttempts++;
    await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
    await this.initializeSocket(userId);
  }

  handleLogout() {
    if (this.socket) {
      this.socket.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  async initialize(userId) {
    const services = Object.keys(this.API_ENDPOINTS).filter(s => s !== 'AUTH_REFRESH');
    for (const service of services) {
      const isAvailable = await this.checkServiceAvailability(this.API_ENDPOINTS[service]);
      if (!isAvailable) {
        console.warn(`${service} service is unavailable`);
      }
    }
    await this.ensureValidToken();
    await this.initializeSocket(userId);
  }
}

const authSocketService = new AuthSocketService();
export default authSocketService;