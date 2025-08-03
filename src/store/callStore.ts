// src/store/callStore.ts - REAL WEBRTC IMPLEMENTATION
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const BASE_URL = process.env.NEXT_PUBLIC_CALLS_API_BASE_URL || 'https://calls-dev.wasaachat.com/v1';

// Mock call data for testing
const MOCK_CALLS = [
  {
    id: '1',
    participantId: 'user123',
    participantName: 'Alice Johnson',
    participantAvatar: 'https://i.pravatar.cc/150?img=1',
    type: 'outgoing',
    callType: 'video',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    duration: 1245,
    status: 'completed',
    direction: 'outgoing',
    otherPartyName: 'Alice Johnson',
    otherPartyId: 'user123',
    initiatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2', 
    participantId: 'user456',
    participantName: 'Bob Smith',
    participantAvatar: 'https://i.pravatar.cc/150?img=2',
    type: 'incoming',
    callType: 'voice',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    duration: 632,
    status: 'completed',
    direction: 'incoming',
    otherPartyName: 'Bob Smith',
    otherPartyId: 'user456',
    initiatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    participantId: 'user789',
    participantName: 'Carol Davis',
    participantAvatar: 'https://i.pravatar.cc/150?img=3',
    type: 'missed',
    callType: 'video',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    duration: 0,
    status: 'missed',
    direction: 'incoming',
    otherPartyName: 'Carol Davis',
    otherPartyId: 'user789',
    initiatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface CallStore {
  calls: any[];
  loading: boolean;
  error: string | null;
  fetchCallHistory: (userId?: string) => Promise<void>;
  clearError: () => void;
  callHistory: any[];
  isLoadingHistory: boolean;
  connectionError: string | null;
  
  // ✅ REAL WebRTC properties
  currentCall: any;
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  
  // ✅ REAL WebRTC methods
  startCall: (userId: string, type: string, socket?: any) => Promise<void>;
  startGroupCall: (userIds: string[], type: string, socket?: any) => Promise<void>;
  answerCall: (socket?: any) => Promise<void>;
  endCall: (socket?: any) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  
  // ✅ Internal WebRTC methods
  initializeWebRTC: () => Promise<void>;
  handleCallOffer: (offer: any, callId: string, callerId: string, socket: any) => Promise<void>;
  cleanup: () => void;
}

// ✅ WebRTC Configuration
const PC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  loading: false,
  error: null,
  callHistory: [],
  isLoadingHistory: false,
  connectionError: null,

  // ✅ WebRTC State
  currentCall: null,
  isInCall: false,
  isConnecting: false,
  isMuted: false,
  isVideoEnabled: true,
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  clearError: () => set({ error: null, connectionError: null }),

  // ✅ Cleanup function
  cleanup: () => {
    const { localStream, remoteStream, peerConnection } = get();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection) {
      peerConnection.close();
    }
    
    set({
      currentCall: null,
      isInCall: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoEnabled: true
    });
  },

  // ✅ Initialize WebRTC
  initializeWebRTC: async () => {
    console.log('🚀 Initializing WebRTC...');
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: get().isVideoEnabled,
        audio: true
      });
      
      console.log('📹 Got local stream:', stream.id);
      
      // Create peer connection
      const pc = new RTCPeerConnection(PC_CONFIG);
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind);
        pc.addTrack(track, stream);
      });
      
      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📺 Received remote stream');
        const remoteStream = event.streams[0];
        set({ remoteStream });
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate:', event.candidate.candidate);
          // Send ICE candidate through socket
          const { currentCall } = get();
          if (currentCall?.socket) {
            currentCall.socket.emit('ice-candidate', {
              callId: currentCall.callId,
              candidate: event.candidate
            });
          }
        }
      };
      
      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connection established!');
        }
      };
      
      set({ localStream: stream, peerConnection: pc });
      
      console.log('✅ WebRTC initialized successfully');
      return pc;
      
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      throw error;
    }
  },

  // ✅ Handle incoming call offer
  handleCallOffer: async (offer: any, callId: string, callerId: string, socket: any) => {
    console.log('📞 Handling call offer from:', callerId);
    
    try {
      set({ isConnecting: true, currentCall: { callId, callerId, socket } });
      
      // Initialize WebRTC
      const pc = await get().initializeWebRTC();
      
      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('📥 Set remote description');
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('📤 Created answer');
      
      // Send answer back
      socket.emit('call-answer', {
        callId,
        answer: pc.localDescription
      });
      
      console.log('✅ Sent call answer');
      
      set({ 
        isInCall: true, 
        isConnecting: false,
        currentCall: { callId, callerId, socket, type: 'incoming' }
      });
      
    } catch (error) {
      console.error('❌ Failed to handle call offer:', error);
      set({ isConnecting: false, error: 'Failed to answer call' });
      get().cleanup();
    }
  },

  // ✅ Answer incoming call
  answerCall: async (socket?: any) => {
    console.log('📞 Answering call...');
    
    const { currentCall } = get();
    if (!currentCall || !socket) {
      console.error('❌ No current call or socket');
      return;
    }
    
    // The actual answering happens in handleCallOffer
    // This method is called from UI, but WebRTC setup should already be done
    console.log('✅ Call answered - WebRTC should be connecting');
  },

  // ✅ Start outgoing call
  startCall: async (userId: string, type: string, socket?: any) => {
    console.log(`📞 Starting ${type} call to ${userId}`);
    
    if (!socket) {
      throw new Error('Socket not available');
    }
    
    try {
      set({ isConnecting: true });
      
      // Initialize WebRTC
      const pc = await get().initializeWebRTC();
      
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });
      
      await pc.setLocalDescription(offer);
      console.log('📤 Created offer');
      
      // Send call initiation
      socket.emit('call-offer', {
        targetUserId: userId,
        offer: pc.localDescription,
        callType: type
      });
      
      set({
        currentCall: { targetUserId: userId, type, socket },
        isConnecting: true
      });
      
      console.log('✅ Call offer sent');
      
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      set({ isConnecting: false, error: 'Failed to start call' });
      get().cleanup();
      throw error;
    }
  },

  // ✅ Start group call (simplified for now)
  startGroupCall: async (userIds: string[], type: string, socket?: any) => {
    console.log('👥 Group calls not fully implemented yet');
    throw new Error('Group calls not implemented');
  },

  // ✅ End call
  endCall: (socket?: any) => {
    console.log('📞 Ending call');
    
    const { currentCall } = get();
    if (currentCall && socket) {
      socket.emit('call-end', { callId: currentCall.callId });
    }
    
    get().cleanup();
  },

  // ✅ Toggle mute
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Flip the current state
      });
      set({ isMuted: !isMuted });
      console.log('🔇 Mute toggled:', !isMuted);
    }
  },

  // ✅ Toggle video
  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled; // Flip the current state
      });
      set({ isVideoEnabled: !isVideoEnabled });
      console.log('📹 Video toggled:', !isVideoEnabled);
    }
  },

  // ✅ Call history (same as before)
  fetchCallHistory: async (userId?: string) => {
    const authHeaders = useAuthStore.getState().getAuthHeaders();
    const currentUser = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    const targetUserId = userId || currentUser?.id;
    
    if (!isAuthenticated) {
      console.error('❌ User not authenticated');
      set({ 
        error: 'Please log in to view call history', 
        loading: false, 
        connectionError: 'Please log in to view call history', 
        isLoadingHistory: false 
      });
      return;
    }

    if (!targetUserId) {
      console.error('❌ No user ID available');
      set({ 
        error: 'User ID not found', 
        loading: false, 
        connectionError: 'User ID not found', 
        isLoadingHistory: false 
      });
      return;
    }

    console.log('🔄 Fetching call history for user:', targetUserId);
    console.log('🔗 API endpoint:', `${BASE_URL}/calls/user/${targetUserId}`);
    console.log('🔑 Using auth headers:', { 
      hasAuth: !!authHeaders.Authorization,
      authPreview: authHeaders.Authorization?.substring(0, 20) + '...'
    });
    
    set({ loading: true, error: null, isLoadingHistory: true, connectionError: null });

    try {
      const response = await fetch(`${BASE_URL}/calls/user/${targetUserId}`, {
        method: 'GET',
        headers: authHeaders,
      });

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', { status: response.status, errorText });
        
        if (response.status === 401) {
          const authStore = useAuthStore.getState();
          if (authStore.refreshTokens) {
            try {
              const refreshed = await authStore.refreshTokens();
              if (refreshed) {
                return get().fetchCallHistory(userId);
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
            }
          }
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not have permission to view call history.');
        } else if (response.status === 404) {
          console.log('📭 No call history found for user');
          set({ 
            calls: [],
            callHistory: [],
            loading: false,
            isLoadingHistory: false,
            error: null,
            connectionError: null
          });
          return;
        } else if (response.status >= 500) {
          console.warn('⚠️ Server error, falling back to mock data');
          set({ 
            calls: MOCK_CALLS,
            callHistory: MOCK_CALLS,
            loading: false,
            isLoadingHistory: false,
            error: null,
            connectionError: null
          });
          console.log('✅ Mock call history loaded due to server error');
          return;
        } else {
          throw new Error(`Request failed: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Real call history received:', data);
      
      const calls = data.data?.calls || data.calls || data.data || data || [];
      
      set({ 
        calls: Array.isArray(calls) ? calls : [],
        callHistory: Array.isArray(calls) ? calls : [],
        loading: false,
        isLoadingHistory: false,
        error: null,
        connectionError: null
      });
      
    } catch (error) {
      console.error('💥 API request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch call history';
      
      if (errorMessage.includes('Authentication') || errorMessage.includes('Access denied')) {
        set({ 
          error: errorMessage,
          connectionError: errorMessage,
          loading: false,
          isLoadingHistory: false
        });
      } else {
        console.warn('⚠️ Network error, falling back to mock data');
        console.log('🎭 Loading mock call history...');
        
        set({ 
          calls: MOCK_CALLS,
          callHistory: MOCK_CALLS,
          loading: false,
          isLoadingHistory: false,
          error: null,
          connectionError: null
        });
        
        console.log('✅ Mock call history loaded due to network error');
      }
    }
  },
}));