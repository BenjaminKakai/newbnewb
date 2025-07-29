import { useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

interface SocketMessage {
  type?: string;
  data?: unknown;
  message?: string;
}

interface UseSocketProps {
  token?: string;
  userId?: string;
  enabled?: boolean;
  onMessage?: (msg: SocketMessage) => void;
}

interface SocketConnectError extends Error {
  type?: string;
  description?: string;
}

export const useSocket = ({ token, userId, enabled = true, onMessage }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !token || !userId) {
      console.log('[notificationSocket] 🚫 Socket connection disabled or missing credentials', {
        enabled,
        hasToken: !!token,
        hasUserId: !!userId,
      });
      return;
    }

    const maxRetries = 5;
    const retryDelay = 2000;

    const connectSocket = () => {
      try {
        console.log('[notificationSocket] 🔌 Attempting to connect to socket', { userId, hasToken: !!token, retryCount });

        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log('[notificationSocket] 🧹 Disconnected existing socket');
        }

        socketRef.current = io(SOCKET_URL, {
          path: '/socket.io',
          transports: ['websocket'],
          auth: {
            token,
            userId,
          },
          reconnection: false,
          timeout: 10000,
          extraHeaders: {
            'Origin': window.location.origin,
          },
        });

        socketRef.current.on('connect', () => {
          console.log('[notificationSocket] ✅ Socket connected successfully');
          setIsConnected(true);
          setConnectionError(null);
          setRetryCount(0);
        });

        socketRef.current.on('connect_error', (error: SocketConnectError) => {
          console.error('[notificationSocket] 🚨 Socket connection error:', {
            message: error.message,
            type: error.type,
            description: error.description,
            stack: error.stack,
          });
          setIsConnected(false);
          setConnectionError(error.message || 'WebSocket connection failed');

          if (retryCount < maxRetries) {
            const nextRetry = retryCount + 1;
            console.log(`[notificationSocket] 🔄 Retrying connection (${nextRetry}/${maxRetries}) in ${retryDelay}ms...`);
            setRetryCount(nextRetry);
            setTimeout(connectSocket, retryDelay * nextRetry);
          } else {
            console.error('[notificationSocket] ❌ Max retries reached. Connection failed.');
            setConnectionError('Max retries reached. Please check server status.');
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('[notificationSocket] 🔌 Socket disconnected:', reason);
          setIsConnected(false);
          if (reason === 'io server disconnect' && retryCount < maxRetries) {
            const nextRetry = retryCount + 1;
            console.log(`[notificationSocket] 🔄 Retrying connection (${nextRetry}/${maxRetries}) due to server disconnect...`);
            setRetryCount(nextRetry);
            setTimeout(connectSocket, retryDelay * nextRetry);
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('[notificationSocket] 🚨 Socket error:', error);
          setConnectionError(error.message || 'Unknown socket error');
        });

        if (onMessage) {
          socketRef.current.on('message', (msg) => {
            console.log('[notificationSocket] 📥 Received message:', msg);
            onMessage(msg);
          });
          socketRef.current.on('call-offer', (data) => {
            console.log('[notificationSocket] 📞 Received call-offer:', data);
            onMessage({ type: 'call-offer', data });
          });
          socketRef.current.on('call-answer', (data) => {
            console.log('[notificationSocket] 📞 Received call-answer:', data);
            onMessage({ type: 'call-answer', data });
          });
          socketRef.current.on('ice-candidate', (data) => {
            console.log('[notificationSocket] 📞 Received ice-candidate:', data);
            onMessage({ type: 'ice-candidate', data });
          });
          socketRef.current.on('call-ended', (data) => {
            console.log('[notificationSocket] 📞 Received call-ended:', data);
            onMessage({ type: 'call-ended', data });
          });
        }
      } catch (error) {
        console.error('[notificationSocket] 🚨 Failed to initialize socket:', error);
        setConnectionError('Failed to initialize socket connection');
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log('[notificationSocket] 🧹 Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setConnectionError(null);
      setRetryCount(0);
    };
  }, [token, userId, enabled, onMessage, retryCount]);

  return { socket: socketRef.current, isConnected, connectionError, retryCount };
};
