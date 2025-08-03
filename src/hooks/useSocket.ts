// src/hooks/useSocket.ts - FIXED VERSION
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ✅ Use environment variables with fallback
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://calls-dev.wasaachat.com';
const SOCKET_TRANSPORT = process.env.NEXT_PUBLIC_SOCKET_TRANSPORT || 'polling';
const SOCKET_UPGRADE = process.env.NEXT_PUBLIC_SOCKET_UPGRADE !== 'false';
const SOCKET_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_SOCKET_TIMEOUT || '10000');

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
  connectionError: string | null;
}

export const useSocket = (
  token: string | null, 
  onLog: (message: string) => void
): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = useRef(3); // Reduced attempts
  const isConnecting = useRef(false);
  
  // ✅ Stable cleanup function
  const cleanup = useCallback(() => {
    setSocket(prevSocket => {
      if (prevSocket && prevSocket.connected) {
        onLog('🔌 Cleaning up socket connection');
        prevSocket.removeAllListeners();
        prevSocket.disconnect();
      }
      return null;
    });
    setIsConnected(false);
    isConnecting.current = false;
  }, [onLog]);

  // ✅ Connect function - NO cleanup at start!
  const connect = useCallback(() => {
    if (!token) {
      onLog('❌ No token provided, skipping socket connection');
      setConnectionError('No authentication token available');
      return;
    }

    if (isConnecting.current) {
      onLog('🔄 Connection already in progress, skipping...');
      return;
    }

    // ✅ Only cleanup if we already have a socket
    if (socket && socket.connected) {
      onLog('🔄 Replacing existing connection');
      cleanup();
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        initiateConnection();
      }, 100);
      return;
    }

    initiateConnection();

    function initiateConnection() {
      isConnecting.current = true;
      setConnectionError(null);

      onLog(`🔌 Connecting to ${SOCKET_URL} with ${SOCKET_TRANSPORT} transport...`);
      
      const socketOptions = {
        auth: { token },
        transports: [SOCKET_TRANSPORT as any],
        upgrade: SOCKET_UPGRADE,
        timeout: SOCKET_TIMEOUT,
        reconnection: false, // ✅ Handle reconnection manually
        forceNew: true, // ✅ Force new connection
      };

      onLog(`🔧 Socket config: ${JSON.stringify(socketOptions, null, 2)}`);
      
      const newSocket = io(SOCKET_URL, socketOptions);

      // ✅ Connection event handlers
      newSocket.on('connect', () => {
        onLog(`✅ Socket connected successfully: ${newSocket.id}`);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        isConnecting.current = false;

        // ✅ CRITICAL: Join user room after connecting
        try {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            const user = JSON.parse(userData);
            const userId = user.id;
            if (userId) {
              const roomId = `user:${userId}`;
              onLog(`🏠 Joining room: ${roomId}`);
              newSocket.emit('join-room', { roomId, userId, userName: user.name || 'Unknown' });
              
              // ✅ Listen for room-joined confirmation
              newSocket.on('room-joined', (data) => {
                onLog(`✅ Joined room successfully: ${JSON.stringify(data)}`);
              });
            } else {
              onLog('⚠️ No user ID found in user data');
            }
          } else {
            onLog('⚠️ No user data found in localStorage');
          }
        } catch (error) {
          onLog(`❌ Error joining room: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      newSocket.on('disconnect', (reason) => {
        onLog(`❌ Socket disconnected: ${reason}`);
        setIsConnected(false);
        isConnecting.current = false;
        
        // ✅ Only auto-reconnect for network issues, not auth issues
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setConnectionError(`Connection lost: ${reason}`);
          // Don't auto-reconnect for server-initiated disconnects
        } else if (reason === 'ping timeout' || reason === 'transport error') {
          setConnectionError(`Network error: ${reason}`);
          handleReconnection();
        } else {
          setConnectionError(`Disconnected: ${reason}`);
        }
      });

      newSocket.on('connect_error', (error) => {
        onLog(`🚨 Socket connection error: ${error.message}`);
        setIsConnected(false);
        isConnecting.current = false;
        setConnectionError(`Connection failed: ${error.message}`);
        
        // ✅ Only retry for non-auth errors
        if (!error.message.includes('Authentication') && !error.message.includes('Unauthorized')) {
          handleReconnection();
        } else {
          onLog('❌ Authentication error - not retrying');
        }
      });

      // ✅ Additional debugging events
      newSocket.on('reconnect', (attemptNumber) => {
        onLog(`🔄 Reconnected after ${attemptNumber} attempts`);
      });

      newSocket.on('reconnect_error', (error) => {
        onLog(`🚨 Reconnection error: ${error.message}`);
      });

      // ✅ Call-related event listeners for debugging
      newSocket.on('call-offer', (data) => {
        onLog(`📞 Call offer received: ${JSON.stringify(data)}`);
      });

      newSocket.on('call-answer', (data) => {
        onLog(`📞 Call answered: ${JSON.stringify(data)}`);
      });

      newSocket.on('call-end', (data) => {
        onLog(`📞 Call ended: ${JSON.stringify(data)}`);
      });

      newSocket.on('call-missed', (data) => {
        onLog(`📞 Call missed: ${JSON.stringify(data)}`);
      });

      newSocket.on('ice-candidate', (data) => {
        onLog(`🧊 ICE candidate received: ${data.candidate ? 'candidate data' : 'end-of-candidates'}`);
      });

      setSocket(newSocket);
    }

    function handleReconnection() {
      if (reconnectAttempts.current < maxReconnectAttempts.current) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 5000);
        onLog(`🔄 Retrying connection in ${delay}ms (${reconnectAttempts.current}/${maxReconnectAttempts.current})...`);
        setTimeout(() => {
          if (!isConnected) { // Only reconnect if still disconnected
            connect();
          }
        }, delay);
      } else {
        onLog('❌ Max reconnection attempts reached');
        setConnectionError('Max reconnection attempts reached. Please refresh the page.');
      }
    }
  }, [token, socket, onLog, cleanup]);

  // ✅ Manual reconnect function
  const reconnect = useCallback(() => {
    onLog('🔄 Manual reconnection triggered');
    reconnectAttempts.current = 0;
    isConnecting.current = false;
    cleanup();
    setTimeout(() => {
      connect();
    }, 200);
  }, [connect, onLog, cleanup]);

  // ✅ Main effect - connect when token is available
  useEffect(() => {
    if (token && !socket) {
      onLog('🚀 Initial socket connection...');
      connect();
    } else if (!token && socket) {
      onLog('🔒 No token - disconnecting socket');
      cleanup();
    }

    // ✅ Cleanup on unmount
    return () => {
      if (socket) {
        cleanup();
      }
    };
  }, [token]); // ✅ Only depend on token

  // ✅ Debug logging
  useEffect(() => {
    onLog(`🔍 Socket state: connected=${isConnected}, error=${connectionError}`);
  }, [isConnected, connectionError, onLog]);

  return {
    socket,
    isConnected,
    reconnect,
    connectionError
  };
};