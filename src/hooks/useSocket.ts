import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCallStore } from '@/store/callStore';

const SOCKET_URL = 'wss://calls-dev.wasaachat.com:9638';

interface UseSocketProps {
  userId?: string;
  enabled?: boolean;
}

export const useSocket = ({ userId, enabled = true }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { setConnected, setCurrentCall, setIsInCall, setLocalStream, setRemoteStream } = useCallStore();

  useEffect(() => {
    if (!enabled || !userId) {
      console.log('[useSocket] 🚫 Socket connection disabled or missing userId', { enabled, hasUserId: !!userId });
      return;
    }

    const connectSocket = () => {
      try {
        console.log('[useSocket] 🔌 Attempting to connect to socket', { userId });

        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log('[useSocket] 🧹 Disconnected existing socket');
        }

        socketRef.current = io(SOCKET_URL, {
          path: '/socket.io',
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 10000,
        });

        socketRef.current.on('connect', () => {
          console.log(`[useSocket] ✅ Socket connected: ${socketRef.current?.id} at ${new Date().toISOString()}`);
          setIsConnected(true);
          setConnected(true);
          setConnectionError(null);
          socketRef.current?.emit('join-room', { roomId: `user:${userId}`, userId, userName: 'Dev' });
        });

        socketRef.current.on('connect_error', (error: Error) => {
          console.error('[useSocket] 🚨 Socket connection error:', error.message);
          setIsConnected(false);
          setConnected(false);
          setConnectionError(error.message || 'WebSocket connection failed');
        });

        socketRef.current.on('disconnect', (reason: string) => {
          console.log(`[useSocket] 🔌 Socket disconnected: ${reason} at ${new Date().toISOString()}`);
          setIsConnected(false);
          setConnected(false);
        });

        socketRef.current.on('error', (data: { message: string }) => {
          console.error(`[useSocket] 🚨 Socket error: ${data.message} at ${new Date().toISOString()}`);
          setConnectionError(data.message || 'Unknown socket error');
        });

        socketRef.current.on('user-presence-changed', (data: { userId: string; status: string } | { userId: string; status: string }[]) => {
          console.log(`[useSocket] User presence changed: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const userData = Array.isArray(data) ? data.find(d => d.userId === userId) : data;
          if (userData) setConnectionError(`User Presence: ${userData.status}`);
        });

        socketRef.current.on('test-socket-communication', (data: { userId: string; userName: string; timestamp: string }) => {
          console.log(`[useSocket] Test socket communication: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          setConnectionError(`Test Socket: ${data.userName}`);
        });

        socketRef.current.on('call-offer', (data: { callId: string; targetId: string; callerId: string; callType: string; offer: { type: string; sdp: string } }) => {
          console.log(`[useSocket] Received call offer: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          setCurrentCall({
            id: data.callId,
            type: 'incoming',
            callType: data.callType as 'voice' | 'video',
            participants: [{ id: data.callerId, name: 'Unknown', status: 'connecting', isMuted: false, isVideoEnabled: data.callType === 'video' }],
            startTime: new Date(),
            status: 'ringing',
            isGroupCall: false,
          });
          setIsInCall(true);
        });

        socketRef.current.on('call-answer', (data: { callId: string; targetId: string; answer: { type: string; sdp: string }; receiverId: string }) => {
          console.log(`[useSocket] Received call answer: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          setCurrentCall({ ...useCallStore.getState().currentCall, status: 'connected' });
        });

        socketRef.current.on('ice-candidate', (data: { callId: string; targetId: string; candidate: RTCIceCandidateInit; senderId: string }) => {
          console.log(`[useSocket] Received ICE candidate: ${JSON.stringify(data.candidate)} at ${new Date().toISOString()}`);
        });

        socketRef.current.on('call-end', (data: { callId: string; targetId: string }) => {
          console.log(`[useSocket] Call ended: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          setCurrentCall(null);
          setIsInCall(false);
          setLocalStream(null);
          setRemoteStream(null);
        });

        socketRef.current.on('room-invite-notification', (data: { targetId: string; roomId: string; roomName: string; hostName: string; hostId: string; type: 'group-call-invite' }) => {
          console.log(`[useSocket] Received room invite: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          if (data.targetId === userId) {
            setCurrentCall({
              id: data.roomId,
              type: 'incoming',
              callType: 'video',
              participants: [{ id: data.hostId, name: data.hostName, status: 'connecting', isMuted: false, isVideoEnabled: true }],
              startTime: new Date(),
              status: 'ringing',
              isGroupCall: true,
            });
            setIsInCall(true);
          }
        });

        socketRef.current.on('broadcast-room-invite', (data: { targetId: string; roomId: string; roomName: string; hostName: string; hostId: string; type: 'group-call-invite' }) => {
          console.log(`[useSocket] Received broadcast room invite: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          if (data.targetId === userId && data.hostId !== userId) {
            setCurrentCall({
              id: data.roomId,
              type: 'incoming',
              callType: 'video',
              participants: [{ id: data.hostId, name: data.hostName, status: 'connecting', isMuted: false, isVideoEnabled: true }],
              startTime: new Date(),
              status: 'ringing',
              isGroupCall: true,
            });
            setIsInCall(true);
          }
        });

        socketRef.current.on('webrtc-participant-ready', (data: { roomId: string; userId: string; userName: string }) => {
          console.log(`[useSocket] Participant ready for WebRTC: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id && data.userId !== userId) {
            setCurrentCall({
              ...currentCall,
              participants: [...currentCall.participants, { id: data.userId, name: data.userName, status: 'connecting', isMuted: false, isVideoEnabled: true }],
            });
          }
        });

        socketRef.current.on('webrtc-offer', (data: { roomId: string; targetId: string; senderId: string; offer: { type: string; sdp: string } }) => {
          console.log(`[useSocket] Received WebRTC offer: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id && data.targetId === userId) {
            setCurrentCall({ ...currentCall, status: 'connecting' });
          }
        });

        socketRef.current.on('webrtc-answer', (data: { roomId: string; targetId: string; senderId: string; answer: { type: string; sdp: string } }) => {
          console.log(`[useSocket] Received WebRTC answer: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id && data.targetId === userId) {
            setCurrentCall({ ...currentCall, status: 'connected' });
          }
        });

        socketRef.current.on('webrtc-ice-candidate', (data: { roomId: string; targetId: string; senderId: string; candidate: RTCIceCandidateInit }) => {
          console.log(`[useSocket] Received WebRTC ICE candidate: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
        });

        socketRef.current.on('webrtc-ready', (data: { roomId: string; userId: string; userName: string }) => {
          console.log(`[useSocket] Received webrtc-ready: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id && data.userId !== userId) {
            setCurrentCall({ ...currentCall, status: 'connected' });
          }
        });

        socketRef.current.on('join-room', (data: { roomId: string; userId: string; userName: string }) => {
          console.log(`[useSocket] Join room: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          setCurrentCall({ ...useCallStore.getState().currentCall, status: 'connecting' });
        });

        socketRef.current.on('room-join-accepted', (data: { roomId: string; roomName: string; userId: string; userName: string; hostId: string }) => {
          console.log(`[useSocket] Room join accepted: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id && data.userId !== userId) {
            setCurrentCall({
              ...currentCall,
              participants: [...currentCall.participants, { id: data.userId, name: data.userName, status: 'connected', isMuted: false, isVideoEnabled: true }],
            });
          }
        });

        socketRef.current.on('room-participant-left', (data: { roomId: string; userId: string; userName: string }) => {
          console.log(`[useSocket] Participant left room: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id) {
            setCurrentCall({
              ...currentCall,
              participants: currentCall.participants.filter(p => p.id !== data.userId),
            });
          }
        });

        socketRef.current.on('end-room', (data: { roomId: string; userId: string }) => {
          console.log(`[useSocket] Room ended: ${JSON.stringify(data)} at ${new Date().toISOString()}`);
          const currentCall = useCallStore.getState().currentCall;
          if (currentCall && data.roomId === currentCall.id) {
            setCurrentCall(null);
            setIsInCall(false);
            setLocalStream(null);
            setRemoteStream(null);
          }
        });

      } catch (error) {
        console.error('[useSocket] 🚨 Failed to initialize socket:', error);
        setConnectionError('Failed to initialize socket connection');
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log('[useSocket] 🧹 Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setConnected(false);
      setConnectionError(null);
    };
  }, [userId, enabled, setConnected, setConnectionError, setCurrentCall, setIsInCall, setLocalStream, setRemoteStream]);

  return { socket: socketRef.current, isConnected, connectionError };
};