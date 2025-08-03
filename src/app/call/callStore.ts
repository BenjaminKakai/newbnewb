import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { devtools } from 'zustand/middleware';
import { useAuthStore } from './authStore';
const API_BASE_URL = process.env.NEXT_PUBLIC_CALLS_API_BASE_URL || "https://calls-dev.wasaachat.com/v1";

interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: 'connecting' | 'connected' | 'disconnected';
  isMuted: boolean;
  isVideoEnabled: boolean;
  stream?: MediaStream;
}

interface Call {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'voice' | 'video';
  participants: CallParticipant[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';
  conversationId?: string;
  isGroupCall: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  roomName?: string;
}

interface CallHistory {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'voice' | 'video';
  timestamp: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'failed';
  direction?: 'incoming' | 'outgoing' | 'missed';
  otherPartyName?: string;
  otherPartyId?: string;
  initiatedAt?: string;
}

interface CallState {
  currentCall: Call | null;
  isInCall: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  handRaised: boolean;
  showAcceptButton: boolean;
  callHistory: CallHistory[];
  isLoadingHistory: boolean;
  currentTab: 'all' | 'incoming' | 'missed' | 'pending' | 'requests' | 'friend-requests';
  showDialPad: boolean;
  showNewCallModal: boolean;
  isConnected: boolean;
  connectionError: string | null;
  setCurrentTab: (tab: CallState['currentTab']) => void;
  setShowDialPad: (show: boolean) => void;
  setShowNewCallModal: (show: boolean) => void;
  initializeMedia: (callType: 'voice' | 'video') => Promise<MediaStream>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleHandRaise: () => void;
  shareScreen: () => Promise<void>;
  startCall: (participantId: string, callType: 'voice' | 'video', socket: Socket) => Promise<MediaStream>;
  startGroupCall: (participantIds: string[], callType: 'voice' | 'video', socket: Socket) => Promise<MediaStream>;
  answerCall: (socket: Socket) => Promise<MediaStream>;
  rejectCall: (socket: Socket) => void;
  endCall: (socket: Socket) => void;
  fetchCallHistory: () => Promise<void>;
  addCallToHistory: (call: CallHistory) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setCurrentCall: (call: Call | null) => void;
  setIsInCall: (inCall: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export const useCallStore = create<CallState>()(
  devtools(
    (set, get) => ({
      currentCall: null,
      isInCall: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: false,
      handRaised: false,
      showAcceptButton: false,
      callHistory: [],
      isLoadingHistory: false,
      currentTab: 'all',
      showDialPad: false,
      showNewCallModal: false,
      isConnected: false,
      connectionError: null,

      setCurrentTab: (tab) => set({ currentTab: tab }),
      setShowDialPad: (show) => set({ showDialPad: show }),
      setShowNewCallModal: (show) => set({ showNewCallModal: show }),

      initializeMedia: async (callType: 'voice' | 'video') => {
        try {
          console.log(`🎥 Initializing media for ${callType} call...`);
          const constraints = {
            audio: true,
            video: callType === 'video' ? { width: 1280, height: 720 } : false,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('✅ Media stream created:', stream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, readyState: t.readyState })));
          
          set({ 
            localStream: stream, 
            isMuted: false, 
            isVideoEnabled: callType === 'video' 
          });
          return stream;
        } catch (error: unknown) {
          console.error('❌ Media initialization failed:', error);
          set({ connectionError: `Media access failed: ${(error as Error).message}` });
          throw error;
        }
      },

      toggleMute: () => {
        const { localStream, isMuted } = get();
        if (!localStream) {
          console.warn('⚠️ No local stream available for audio toggle');
          return;
        }
        const audioTracks = localStream.getAudioTracks();
        const newMutedState = !isMuted;
        audioTracks.forEach(track => {
          track.enabled = !newMutedState;
        });
        set({ isMuted: newMutedState });
        console.log(`🎤 Audio ${newMutedState ? 'muted' : 'enabled'}`);
      },

      toggleVideo: () => {
        const { localStream, isVideoEnabled } = get();
        if (!localStream) {
          console.warn('⚠️ No local stream available for video toggle');
          return;
        }
        const videoTracks = localStream.getVideoTracks();
        const newVideoState = !isVideoEnabled;
        videoTracks.forEach(track => {
          track.enabled = newVideoState;
        });
        set({ isVideoEnabled: newVideoState });
        console.log(`📹 Video ${newVideoState ? 'enabled' : 'disabled'}`);
      },

      toggleSpeaker: () => {
        const { isSpeakerOn } = get();
        set({ isSpeakerOn: !isSpeakerOn });
        console.log(`🔊 Speaker ${!isSpeakerOn ? 'on' : 'off'}`);
      },

      toggleHandRaise: () => {
        const { handRaised } = get();
        const newHandRaisedState = !handRaised;
        set({ handRaised: newHandRaisedState });
        console.log(`✋ Hand ${newHandRaisedState ? 'raised' : 'lowered'}`);
      },

      shareScreen: async () => {
        try {
          console.log('🖥️ Starting screen share...');
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          const { localStream } = get();
          const originalStream = localStream;
          set({ localStream: screenStream });
          screenStream.getVideoTracks()[0].onended = () => {
            console.log('🖥️ Screen sharing ended, switching back to camera');
            set({ localStream: originalStream });
          };
          console.log('✅ Screen sharing started');
        } catch (error: unknown) {
          console.error('❌ Screen sharing failed:', error);
          set({ connectionError: `Screen sharing failed: ${(error as Error).message}` });
          throw error;
        }
      },

      startCall: async (participantId: string, callType: 'voice' | 'video', socket: Socket) => {
        try {
          set({ isConnecting: true, connectionError: null });
          const stream = await get().initializeMedia(callType);
          const { user } = useAuthStore.getState();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          if (!socket?.connected) {
            throw new Error('Socket not connected');
          }

          // Create a unique call ID locally
          const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Initialize WebRTC peer connection
          const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('ice-candidate', {
                callId,
                targetId: participantId,
                candidate: event.candidate,
                senderId: user.id,
              });
            }
          };

          // Emit call offer via WebSocket
          socket.emit('call-offer', {
            callId,
            targetId: participantId,
            callerId: user.id,
            callType,
            offer,
          });

          set({
            currentCall: {
              id: callId,
              type: 'outgoing',
              callType,
              participants: [
                {
                  id: participantId,
                  name: 'Unknown',
                  status: 'connecting',
                  isMuted: false,
                  isVideoEnabled: callType === 'video',
                },
              ],
              startTime: new Date(),
              status: 'connecting',
              isGroupCall: false,
            },
            isInCall: true,
            isMuted: false,
            isVideoEnabled: callType === 'video',
          });

          console.log(`✅ Call offer sent to ${participantId}`);
          return stream;
        } catch (error: unknown) {
          console.error('❌ Failed to start call:', error);
          set({ isConnecting: false, connectionError: `Failed to start call: ${(error as Error).message}` });
          throw error;
        }
      },

      startGroupCall: async (participantIds: string[], callType: 'voice' | 'video', socket: Socket) => {
        try {
          set({ isConnecting: true, connectionError: null });
          const stream = await get().initializeMedia(callType);
          const { user } = useAuthStore.getState();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          if (!socket?.connected) {
            throw new Error('Socket not connected');
          }

          // Create a unique room ID locally
          const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Join the room
          socket.emit('join-room', {
            roomId,
            userId: user.id,
            userName: user.name || 'Dev',
          });

          // Initialize WebRTC peer connection
          const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              participantIds.forEach(targetId => {
                socket.emit('webrtc-ice-candidate', {
                  roomId,
                  targetId,
                  senderId: user.id,
                  candidate: event.candidate,
                });
              });
            }
          };

          // Send room invites to participants
          participantIds.forEach(targetId => {
            socket.emit('room-invite-notification', {
              targetId,
              roomId,
              roomName: `Group Call with ${user.name || 'Dev'}`,
              hostId: user.id,
              hostName: user.name || 'Dev',
              type: 'group-call-invite',
            });
          });

          // Signal readiness for WebRTC
          socket.emit('webrtc-participant-ready', {
            roomId,
            userId: user.id,
            userName: user.name || 'Dev',
          });

          set({
            currentCall: {
              id: roomId,
              type: 'outgoing',
              callType,
              participants: participantIds.map(id => ({
                id,
                name: 'Unknown',
                status: 'connecting',
                isMuted: false,
                isVideoEnabled: callType === 'video',
              })),
              startTime: new Date(),
              status: 'connecting',
              isGroupCall: true,
            },
            isInCall: true,
            isMuted: false,
            isVideoEnabled: callType === 'video',
          });

          console.log(`✅ Group call offer sent to ${participantIds.length} participants`);
          return stream;
        } catch (error: unknown) {
          console.error('❌ Failed to start group call:', error);
          set({ isConnecting: false, connectionError: `Failed to start group call: ${(error as Error).message}` });
          throw error;
        }
      },

      answerCall: async (socket: Socket) => {
        try {
          const { currentCall } = get();
          const callType = currentCall?.callType || 'voice';
          const stream = await get().initializeMedia(callType);
          if (!socket?.connected) {
            throw new Error('Socket not connected');
          }

          const { user } = useAuthStore.getState();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }

          const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          peerConnection.onicecandidate = (event) => {
            if (event.candidate && currentCall) {
              socket.emit(currentCall.isGroupCall ? 'webrtc-ice-candidate' : 'ice-candidate', {
                [currentCall.isGroupCall ? 'roomId' : 'callId']: currentCall.id,
                targetId: currentCall.participants[0].id,
                candidate: event.candidate,
                senderId: user.id,
              });
            }
          };

          socket.emit(currentCall?.isGroupCall ? 'webrtc-answer' : 'call-answer', {
            [currentCall?.isGroupCall ? 'roomId' : 'callId']: currentCall?.id,
            targetId: currentCall?.participants[0].id,
            answer,
            senderId: user.id,
          });

          socket.emit(currentCall?.isGroupCall ? 'webrtc-participant-ready' : 'join-room', {
            [currentCall?.isGroupCall ? 'roomId' : 'roomId']: currentCall?.id,
            userId: user.id,
            userName: user.name || 'Dev',
          });

          set({
            showAcceptButton: false,
            isInCall: true,
            isMuted: false,
            isVideoEnabled: callType === 'video',
            connectionError: null,
          });

          console.log(`✅ Call answered - Audio: ON, Video: ${callType === 'video' ? 'ON' : 'OFF'}`);
          return stream;
        } catch (error: unknown) {
          console.error('❌ Failed to answer call:', error);
          set({ connectionError: `Failed to answer call: ${(error as Error).message}` });
          throw error;
        }
      },

      rejectCall: (socket: Socket) => {
        if (socket?.connected) {
          const { currentCall } = get();
          if (currentCall) {
            socket.emit(currentCall.isGroupCall ? 'end-room' : 'call-end', {
              [currentCall.isGroupCall ? 'roomId' : 'callId']: currentCall.id,
              [currentCall.isGroupCall ? 'userId' : 'targetId']: currentCall.participants[0].id,
            });
          }
        }
        get().endCall(socket);
        console.log('❌ Call rejected');
      },

      endCall: (socket: Socket) => {
        if (socket?.connected) {
          const { currentCall } = get();
          if (currentCall) {
            socket.emit(currentCall.isGroupCall ? 'end-room' : 'call-end', {
              [currentCall.isGroupCall ? 'roomId' : 'callId']: currentCall.id,
              [currentCall.isGroupCall ? 'userId' : 'targetId']: currentCall.participants[0].id,
            });
          }
        }
        const { localStream, remoteStream } = get();
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        if (remoteStream) {
          remoteStream.getTracks().forEach(track => track.stop());
        }
        set({
          currentCall: null,
          isInCall: false,
          isConnecting: false,
          localStream: null,
          remoteStream: null,
          showAcceptButton: false,
          isMuted: false,
          isVideoEnabled: true,
          handRaised: false,
          connectionError: null,
        });
        console.log('✅ Call ended');
      },

      fetchCallHistory: async () => {
        set({ isLoadingHistory: true, connectionError: null });
        try {
          const { user } = useAuthStore.getState();
          if (!user?.id) {
            throw new Error('No authentication data available');
          }
          const response = await fetch(`${API_BASE_URL}/calls/public/user/${user.id}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch call history failed:', { status: response.status, errorText });
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch call history'}`);
          }
          const data = await response.json();
          console.log('📜 Call history response:', JSON.stringify(data, null, 2));

          const calls = data.data?.calls || [];

          const callHistory: CallHistory[] = calls
            .filter((call): call is Record<string, unknown> => typeof call === 'object' && call !== null)
            .map((call) => ({
              id: (call.id as string) || `temp-${Date.now()}`,
              participantId: 'unknown', // Note: otherPartyId is not returned by public endpoint
              participantName: (call.otherPartyName as string) || 'Unknown',
              participantAvatar: undefined,
              type: (call.direction as 'incoming' | 'outgoing' | 'missed') || 'missed',
              callType: (call.type as 'voice' | 'video') || 'voice',
              timestamp: new Date((call.initiatedAt as string) || Date.now()),
              duration: (call.duration as number) || 0,
              status: (call.status as 'completed' | 'missed' | 'failed') || 'missed',
            }));

          set({ callHistory, isLoadingHistory: false });
          console.log(`✅ Fetched ${callHistory.length} call history items`);
        } catch (error: unknown) {
          console.error('❌ Failed to fetch call history:', error);
          set({
            isLoadingHistory: false,
            connectionError: `Failed to fetch call history: ${(error as Error).message}`,
          });
        }
      },

      addCallToHistory: (call: CallHistory) => {
        const { callHistory } = get();
        set({ callHistory: [call, ...callHistory] });
      },

      setConnected: (connected) => {
        set({
          isConnected: connected,
          connectionError: connected ? null : get().connectionError,
        });
      },
      setConnectionError: (error) => set({ connectionError: error }),
      setCurrentCall: (call) => set({ currentCall: call }),
      setIsInCall: (inCall) => set({ isInCall: inCall }),
      setIsConnecting: (connecting) => set({ isConnecting: connecting }),
      setLocalStream: (stream) => set({ localStream: stream }),
      setRemoteStream: (stream) => set({ remoteStream: stream }),
    }),
    { name: 'CallStore' }
  )
);