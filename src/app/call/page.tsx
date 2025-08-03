'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCallStore } from '@/store/callStore';

// ✅ SINGLE, CORRECT CallHistory interface
interface CallHistory {
  id: string;
  direction: 'incoming' | 'outgoing';
  otherPartyId: string;
  otherPartyName: string;
  type: 'voice' | 'video';
  status: 'completed' | 'missed' | 'rejected' | 'failed';
  duration: number;
  initiatedAt: string;
  startTime?: string;
  endTime?: string;
  // Legacy fields for compatibility
  participantId?: string;
  participantName?: string;
  callType?: 'voice' | 'video';
  timestamp?: Date;
}

import { useSocket } from '@/hooks/useSocket';
import { 
  PhoneCall, 
  PhoneOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react';

interface ConnectionStatus {
  status: 'connected' | 'reconnecting' | 'disconnected' | 'no-auth';
  text: string;
  color: string;
}

interface Call {
  callId?: string;
  callerName?: string;
  callerId?: string;
  callType?: string;
  offer?: any;
  socket?: any;
}

const CallPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const { 
    fetchCallHistory, 
    isLoadingHistory, 
    startCall, 
    startGroupCall, 
    answerCall, 
    endCall,
    currentCall,
    isInCall,
    isConnecting,
    isMuted,
    isVideoEnabled,
    callHistory,
    connectionError,
    localStream,
    remoteStream,
    toggleMute,
    toggleVideo,
    handleCallOffer,
    cleanup
  } = useCallStore();
  
  const { socket, isConnected, reconnect } = useSocket(accessToken, (msg) => console.log('[SOCKET]', msg));

  const [targetUserId, setTargetUserId] = useState('');
  const [groupUserIds, setGroupUserIds] = useState('');
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // ✅ Video refs for WebRTC streams
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ✅ Store peer connection and call state for direct WebRTC handling
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  
  // ✅ Store call details in refs to persist during ICE generation
  const currentCallIdRef = useRef<string | null>(null);
  const currentTargetIdRef = useRef<string | null>(null);

  // ✅ **FIXED** - Simple, reliable remote stream assignment
  const assignRemoteStream = useCallback((stream: MediaStream, source: string) => {
    console.log(`[CALL PAGE] 📺 assignRemoteStream called from: ${source}`);
    console.log(`[CALL PAGE] 📺 Stream tracks:`, stream.getTracks().map(t => `${t.kind}-${t.id.slice(0,8)}`));
    
    // ✅ CRITICAL: Filter out duplicate tracks - only use first of each kind
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    
    console.log(`[CALL PAGE] 📺 Found ${audioTracks.length} audio, ${videoTracks.length} video tracks`);
    
    // Create clean stream with only one track of each type
    const cleanStream = new MediaStream();
    if (audioTracks.length > 0) {
      cleanStream.addTrack(audioTracks[0]); // Only first audio track
      console.log(`[CALL PAGE] ➕ Added audio track: ${audioTracks[0].id.slice(0,8)}`);
    }
    if (videoTracks.length > 0) {
      cleanStream.addTrack(videoTracks[0]); // Only first video track
      console.log(`[CALL PAGE] ➕ Added video track: ${videoTracks[0].id.slice(0,8)}`);
    }
    
    console.log(`[CALL PAGE] ✅ Clean stream created with ${cleanStream.getTracks().length} tracks`);
    
    // Set state
    setRemoteStreamState(cleanStream);
    
    // Assign to video element
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = cleanStream;
      remoteVideoRef.current.autoplay = true;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.muted = false;
      
      // Simple play attempt
      remoteVideoRef.current.play()
        .then(() => console.log(`[CALL PAGE] ✅ Remote video playing from ${source}`))
        .catch(error => {
          console.log(`[CALL PAGE] ⚠️ Video play failed, trying muted:`, error);
          // Try muted if regular play fails
          remoteVideoRef.current!.muted = true;
          return remoteVideoRef.current!.play();
        })
        .then(() => console.log(`[CALL PAGE] ✅ Remote video playing (possibly muted)`))
        .catch(error => console.log(`[CALL PAGE] ❌ Video play completely failed:`, error));
    }
    
    return true;
  }, []);

  // ✅ Debug effect to check auth and socket state
  useEffect(() => {
    console.log('🔍 [CALL PAGE] DEBUG - Auth State:', {
      user: user?.id,
      accessToken: !!accessToken,
      isAuthenticated: !!user && !!accessToken
    });
    
    console.log('🔍 [CALL PAGE] DEBUG - Socket State:', {
      hasSocket: !!socket,
      isConnected,
      socketId: socket?.id
    });
  }, [user, accessToken, socket, isConnected]);

  // ✅ **SIMPLIFIED** - Single video element assignment
  useEffect(() => {
    if (localStreamState && localVideoRef.current && localVideoRef.current.srcObject !== localStreamState) {
      console.log('[CALL PAGE] 📹 Setting local video stream');
      localVideoRef.current.srcObject = localStreamState;
      localVideoRef.current.play().catch(e => console.log('Local video play failed:', e));
    }
  }, [localStreamState]);

  // ✅ **REMOVED** - Conflicting remote video assignment useEffect

  useEffect(() => {
    if (!user || !accessToken) {
      console.log('[CALL PAGE] 🚫 No user or token available');
      return;
    }

    console.log('[CALL PAGE] 🚀 Initializing for user:', user?.id);
    
    const loadCallHistory = async () => {
      try {
        setIsLoadingCalls(true);
        await fetchCallHistory();
        console.log('[CALL PAGE] ✅ Call history loaded successfully');
      } catch (error: unknown) {
        console.error('[CALL PAGE] ❌ Failed to load call history:', error);
      } finally {
        setIsLoadingCalls(false);
      }
    };

    loadCallHistory();
  }, [user, accessToken, fetchCallHistory]);

  // ✅ **FIXED** - Initialize WebRTC peer connection without duplicate transceivers
  const initializePeerConnection = useCallback(async () => {
    try {
      console.log('[CALL PAGE] 🔧 Initializing peer connection');
      
      // ✅ Close existing connection first
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });

      // ✅ **FIXED** - Better transceiver management to prevent duplicates
      const existingTransceivers = pc.getTransceivers();
      console.log('[CALL PAGE] 🔧 Existing transceivers:', existingTransceivers.length);
      
      if (existingTransceivers.length === 0) {
        console.log('[CALL PAGE] 🔧 Adding transceivers for bidirectional media');
        const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
        const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
        console.log('[CALL PAGE] ✅ Added audio transceiver:', audioTransceiver.mid);
        console.log('[CALL PAGE] ✅ Added video transceiver:', videoTransceiver.mid);
      } else {
        console.log('[CALL PAGE] ⚠️ Transceivers already exist, count:', existingTransceivers.length);
        existingTransceivers.forEach((t, i) => {
          console.log(`[CALL PAGE] 📡 Transceiver ${i}:`, t.receiver?.track?.kind, 'direction:', t.direction);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('[CALL PAGE] 🧊 Sending ICE candidate');
          
          const callId = currentCallIdRef.current;
          const targetId = currentTargetIdRef.current;
          
          if (callId && targetId) {
            socket.emit('ice-candidate', {
              callId: callId,
              targetId: targetId,
              candidate: event.candidate,
              senderId: user?.id
            });
          }
        }
      };

      // ✅ **FIXED** - Single, clean ontrack handler
      pc.ontrack = (event) => {
        console.log('[CALL PAGE] 📺 Received remote track:', event.track.kind, 'ID:', event.track.id);
        
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log('[CALL PAGE] 📺 Using stream from event:', remoteStream.id);
          assignRemoteStream(remoteStream, 'ontrack-event');
        }
      };

      // ✅ ICE connection monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('[CALL PAGE] 🧊 ICE connection state:', pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'failed') {
          console.log('[CALL PAGE] ❌ ICE connection failed, attempting restart');
          pc.restartIce();
        }
      };

      // ✅ **FIXED** - Simplified connection state monitoring
      pc.onconnectionstatechange = async () => {
        console.log('[CALL PAGE] 🔗 Connection state:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          console.log('[CALL PAGE] ✅ WebRTC connection established');
          
          // ✅ **FIXED** - Only construct stream if we don't have one, with deduplication
          if (!remoteStreamState) {
            setTimeout(() => {
              const receivers = pc.getReceivers();
              const activeReceivers = receivers.filter(r => r.track?.readyState === 'live');
              
              console.log('[CALL PAGE] 📥 Active receivers:', activeReceivers.length);
              
              if (activeReceivers.length > 0) {
                // ✅ CRITICAL: Deduplicate tracks by kind
                const audioReceivers = activeReceivers.filter(r => r.track?.kind === 'audio');
                const videoReceivers = activeReceivers.filter(r => r.track?.kind === 'video');
                
                console.log('[CALL PAGE] 📥 Audio receivers:', audioReceivers.length, 'Video receivers:', videoReceivers.length);
                
                const constructedStream = new MediaStream();
                
                // Add only the FIRST track of each kind
                if (audioReceivers.length > 0 && audioReceivers[0].track) {
                  constructedStream.addTrack(audioReceivers[0].track);
                  console.log('[CALL PAGE] ➕ Added first audio track:', audioReceivers[0].track.id.slice(0,8));
                }
                if (videoReceivers.length > 0 && videoReceivers[0].track) {
                  constructedStream.addTrack(videoReceivers[0].track);
                  console.log('[CALL PAGE] ➕ Added first video track:', videoReceivers[0].track.id.slice(0,8));
                }
                
                if (constructedStream.getTracks().length > 0) {
                  console.log('[CALL PAGE] 🔧 Constructed CLEAN stream with', constructedStream.getTracks().length, 'tracks');
                  assignRemoteStream(constructedStream, 'connection-established');
                }
              }
            }, 1000);
          }
        }
      };

      // ✅ Add existing local stream tracks if available
      if (localStreamState) {
        console.log('[CALL PAGE] ➕ Adding existing local stream tracks');
        localStreamState.getTracks().forEach(track => {
          const sender = pc.addTrack(track, localStreamState);
          console.log('[CALL PAGE] ✅ Added track:', track.kind);
        });
      }

      peerConnectionRef.current = pc;
      return pc;
      
    } catch (error) {
      console.error('[CALL PAGE] ❌ Failed to initialize peer connection:', error);
      throw error;
    }
  }, [socket, user, localStreamState, assignRemoteStream]);

  // ✅ Initialize local media
  const initializeLocalMedia = useCallback(async (withVideo = true) => {
    try {
      console.log('[CALL PAGE] 📹 Getting local media, video:', withVideo);
      
      // ✅ Stop existing stream first
      if (localStreamState) {
        localStreamState.getTracks().forEach(track => track.stop());
        setLocalStreamState(null);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true
      });
      
      console.log('[CALL PAGE] ✅ Got local stream with', stream.getTracks().length, 'tracks');
      setLocalStreamState(stream);
      
      return stream;
      
    } catch (error) {
      console.error('[CALL PAGE] ❌ Failed to get local media:', error);
      throw error;
    }
  }, [localStreamState]);

  // ✅ **FIXED** socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) {
      return;
    }

    console.log('[CALL PAGE] 🎧 Setting up socket listeners');

    const handleCallOfferEvent = async (data: any) => {
      try {
        console.log('[CALL PAGE] 📞 Received call-offer:', data);
        console.log('[CALL PAGE] 🔍 Offer SDP preview:', data.offer?.sdp?.substring(0, 200));
        
        const { callId, callerId, offer, callType } = data;
        
        currentCallIdRef.current = callId;
        currentTargetIdRef.current = callerId;
        setIsOutgoingCall(false);
        
        setIncomingCall({
          callId,
          callerId,
          callerName: callerId,
          callType,
          offer,
          socket
        });

        // ✅ CRITICAL: Initialize media BEFORE peer connection to ensure tracks are ready
        console.log('[CALL PAGE] 🔧 Getting local media BEFORE setting up peer connection');
        const localStream = await initializeLocalMedia(callType === 'video');
        
        // ✅ CRITICAL: Initialize peer connection AFTER we have local media
        console.log('[CALL PAGE] 🔧 Creating peer connection with local stream ready');
        const pc = await initializePeerConnection();
        
        // ✅ CRITICAL: Add local tracks to peer connection BEFORE setting remote description
        console.log('[CALL PAGE] 🔧 Adding local tracks before setting remote description');
        localStream.getTracks().forEach(track => {
          console.log('[CALL PAGE] ➕ Adding local track to peer connection:', track.kind, track.id.slice(0,8));
          pc.addTrack(track, localStream);
        });
        
        // ✅ CRITICAL: Set remote description from the offer
        console.log('[CALL PAGE] 🔧 Setting remote description from offer');
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[CALL PAGE] ✅ Remote description set, signaling state:', pc.signalingState);
        
        // ✅ CRITICAL: Create answer with explicit constraints matching the demo
        console.log('[CALL PAGE] 🔧 Creating answer with explicit constraints');
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video',
          voiceActivityDetection: false  // Match demo settings
        });
        
        console.log('[CALL PAGE] 🔍 Answer SDP preview:', answer.sdp?.substring(0, 200));
        
        // ✅ CRITICAL: Set local description
        await pc.setLocalDescription(answer);
        console.log('[CALL PAGE] ✅ Local description set, signaling state:', pc.signalingState);
        
        // ✅ Log current transceivers after answer creation
        const transceivers = pc.getTransceivers();
        console.log('[CALL PAGE] 📡 Transceivers after answer:', transceivers.length);
        transceivers.forEach((t, i) => {
          console.log(`[CALL PAGE] 📡 Transceiver ${i}: ${t.receiver?.track?.kind} direction:${t.direction} mid:${t.mid}`);
        });
        
        console.log('[CALL PAGE] ✅ Answer created, waiting for user acceptance');
        
      } catch (error) {
        console.error('[CALL PAGE] ❌ Error handling call offer:', error);
        console.error('[CALL PAGE] ❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500)
        });
        setIncomingCall(null);
        
        // Cleanup on error
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      }
    };

    const handleCallAnswerEvent = async (data: any) => {
      console.log('[CALL PAGE] 📞 Received call-answer:', data);
      console.log('[CALL PAGE] 🔍 Answer SDP preview:', data.answer?.sdp?.substring(0, 200));
      
      if (peerConnectionRef.current && data.answer) {
        try {
          const pc = peerConnectionRef.current;
          console.log('[CALL PAGE] 🔧 Current signaling state before answer:', pc.signalingState);
          console.log('[CALL PAGE] 🔧 Current connection state before answer:', pc.connectionState);
          
          // ✅ CRITICAL: Verify we're in the right state to receive an answer
          if (pc.signalingState !== 'have-local-offer') {
            console.warn('[CALL PAGE] ⚠️ Unexpected signaling state for answer:', pc.signalingState);
          }
          
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          
          console.log('[CALL PAGE] ✅ Set remote description from answer');
          console.log('[CALL PAGE] 🔧 Signaling state after answer:', pc.signalingState);
          console.log('[CALL PAGE] 🔧 Connection state after answer:', pc.connectionState);
          
          // ✅ Log transceivers after setting remote description
          const transceivers = pc.getTransceivers();
          console.log('[CALL PAGE] 📡 Transceivers after setting remote description:', transceivers.length);
          transceivers.forEach((t, i) => {
            console.log(`[CALL PAGE] 📡 T${i}: ${t.receiver?.track?.kind} dir:${t.direction} associated:${!!t.receiver?.track}`);
          });
          
          setIncomingCall(null);
          console.log('[CALL PAGE] ✅ Call connection process completed');
          
        } catch (error) {
          console.error('[CALL PAGE] ❌ Failed to set remote description from answer:', error);
          console.error('[CALL PAGE] ❌ Error details:', {
            name: error.name,
            message: error.message,
            currentState: peerConnectionRef.current?.signalingState
          });
        }
      } else {
        console.warn('[CALL PAGE] ⚠️ No peer connection or answer data:', {
          hasPeerConnection: !!peerConnectionRef.current,
          hasAnswer: !!data.answer,
          answerType: data.answer?.type
        });
      }
    };

    const handleIceCandidateEvent = async (data: any) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('[CALL PAGE] ✅ Added ICE candidate');
        } catch (error) {
          console.error('[CALL PAGE] ❌ Failed to add ICE candidate:', error);
        }
      }
    };

    const handleCallEndEvent = () => {
      console.log('[CALL PAGE] 📞 Call ended');
      setIncomingCall(null);
      setIsOutgoingCall(false);
      
      currentCallIdRef.current = null;
      currentTargetIdRef.current = null;
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (localStreamState) {
        localStreamState.getTracks().forEach(track => track.stop());
        setLocalStreamState(null);
      }
      
      setRemoteStreamState(null);
      
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      
      cleanup();
    };

    socket.on('call-offer', handleCallOfferEvent);
    socket.on('call-answer', handleCallAnswerEvent);
    socket.on('ice-candidate', handleIceCandidateEvent);
    socket.on('call-end', handleCallEndEvent);

    return () => {
      socket.off('call-offer', handleCallOfferEvent);
      socket.off('call-answer', handleCallAnswerEvent);
      socket.off('ice-candidate', handleIceCandidateEvent);
      socket.off('call-end', handleCallEndEvent);
    };
  }, [socket, isConnected, user?.id, initializeLocalMedia, initializePeerConnection, localStreamState, cleanup]);

  // ✅ **FIXED** - Handle outgoing video calls with explicit track addition
  const handleStartVideoCall = useCallback(async () => {
    if (!user?.id || !isConnected || !targetUserId.trim()) {
      alert('❌ Missing requirements for call');
      return;
    }
    
    try {
      console.log(`[CALL PAGE] 📞 Starting video call to ${targetUserId}`);
      
      // ✅ FIXED: Get local media and use returned stream directly
      const localStream = await initializeLocalMedia(true);
      const pc = await initializePeerConnection();
      
      // ✅ CRITICAL: Explicitly add local tracks to peer connection
      console.log('[CALL PAGE] 🔧 Adding local tracks to outgoing call peer connection');
      localStream.getTracks().forEach(track => {
        console.log('[CALL PAGE] ➕ Adding local track to peer connection:', track.kind, track.id.slice(0,8));
        pc.addTrack(track, localStream);
      });
      
      // ✅ Create offer AFTER adding local tracks
      console.log('[CALL PAGE] 🔧 Creating offer with local tracks attached');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: false
      });
      await pc.setLocalDescription(offer);
      
      console.log('[CALL PAGE] 🔍 Offer SDP preview:', offer.sdp?.substring(0, 200));
      
      const response = await fetch(`https://calls-dev.wasaachat.com/v1/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          callType: 'video',
          settings: { video: true, audio: true }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      const callId = data.data.callId;
      
      currentCallIdRef.current = callId;
      currentTargetIdRef.current = targetUserId.trim();

      console.log('[CALL PAGE] 🚀 Sending call-offer with local tracks included');
      socket.emit('call-offer', {
        callId,
        targetId: targetUserId.trim(),
        offer,
        callerId: user.id,
        callType: 'video'
      });

      setIsOutgoingCall(true);
      setIncomingCall({
        callId,
        callerId: user.id,
        callerName: 'You (Outgoing)',
        callType: 'video',
        offer: null,
        socket
      });
      
    } catch (error) {
      console.error('[CALL PAGE] ❌ Start video call error:', error);
      alert(`❌ Failed to start video call: ${error}`);
      // Cleanup on error
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIsOutgoingCall(false);
      setIncomingCall(null);
    }
  }, [socket, user, targetUserId, isConnected, accessToken, initializeLocalMedia, initializePeerConnection]);

  
    // ✅ **FIXED** - Handle outgoing audio calls with explicit track addition
// ✅ **FIXED** - Handle outgoing audio calls with explicit track addition
  const handleStartAudioCall = useCallback(async () => {
    if (!user?.id || !isConnected || !targetUserId.trim()) {
      alert('❌ Missing requirements for call');
      return;
    }
    
    try {
      console.log(`[CALL PAGE] 📞 Starting audio call to ${targetUserId}`);
      
      // ✅ FIXED: Get local media and use returned stream directly
      const localStream = await initializeLocalMedia(false);
      const pc = await initializePeerConnection();
      
      // ✅ CRITICAL: Explicitly add local tracks to peer connection
      console.log('[CALL PAGE] 🔧 Adding local tracks to outgoing call peer connection');
      localStream.getTracks().forEach(track => {
        console.log('[CALL PAGE] ➕ Adding local track to peer connection:', track.kind, track.id.slice(0,8));
        pc.addTrack(track, localStream);
      });
      
      // ✅ Create offer AFTER adding local tracks
      console.log('[CALL PAGE] 🔧 Creating offer with local tracks attached');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: false
      });
      await pc.setLocalDescription(offer);
      
      console.log('[CALL PAGE] 🔍 Offer SDP preview:', offer.sdp?.substring(0, 200));
      
      const response = await fetch(`https://calls-dev.wasaachat.com/v1/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          callType: 'voice',
          settings: { video: false, audio: true }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      const callId = data.data.callId;
      
      currentCallIdRef.current = callId;
      currentTargetIdRef.current = targetUserId.trim();

      console.log('[CALL PAGE] 🚀 Sending call-offer with local tracks included');
      socket.emit('call-offer', {
        callId,
        targetId: targetUserId.trim(),
        offer,
        callerId: user.id,
        callType: 'voice'
      });

      setIsOutgoingCall(true);
      setIncomingCall({
        callId,
        callerId: user.id,
        callerName: 'You (Outgoing)',
        callType: 'voice',
        offer: null,
        socket
      });
      
    } catch (error) {
      console.error('[CALL PAGE] ❌ Start audio call error:', error);
      alert(`❌ Failed to start audio call: ${error}`);
    }
  }, [socket, user, targetUserId, isConnected, accessToken, initializeLocalMedia, initializePeerConnection]);

  const handleStartGroupCall = useCallback(async () => {
    if (!user?.id || !isConnected) {
      alert('❌ User or socket not available');
      return;
    }
    
    const userIds = groupUserIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 0) {
      alert('⚠️ Please enter at least one user ID for group call');
      return;
    }
    
    try {
      await startGroupCall(userIds, 'video', socket);
    } catch (error) {
      console.error('[CALL PAGE] ❌ Start group call error:', error);
      alert(`❌ Failed to start group call: ${error}`);
    }
  }, [socket, startGroupCall, user, groupUserIds, isConnected]);

  const handleAnswerCall = useCallback(async () => {
    if (!isConnected || !incomingCall || !peerConnectionRef.current) {
      alert('❌ No incoming call or connection not ready');
      return;
    }
    
    try {
      console.log('[CALL PAGE] 📞 Answering call:', incomingCall.callId);
      
      const pc = peerConnectionRef.current;
      const localDescription = pc.localDescription;
      
      if (!localDescription) throw new Error('No local description found');
      
      console.log('[CALL PAGE] 🔍 Sending answer with:');
      console.log('  - callId:', incomingCall.callId);
      console.log('  - targetId (caller):', incomingCall.callerId);
      console.log('  - receiverId (me):', user?.id);
      console.log('  - answer type:', localDescription.type);
      console.log('  - SDP length:', localDescription.sdp?.length);
      console.log('  - Signaling state:', pc.signalingState);
      console.log('  - Connection state:', pc.connectionState);
      
      // ✅ CRITICAL: Use exact same format as demo for compatibility
      const answerData = {
        callId: incomingCall.callId,
        targetId: incomingCall.callerId,  // The person who called us
        answer: {
          type: localDescription.type,    // Should be "answer"
          sdp: localDescription.sdp
        },
        receiverId: user?.id  // Our own user ID
      };
      
      // ✅ CRITICAL: Send answer immediately, don't wait for user click
      console.log('[CALL PAGE] 🚀 Sending call-answer via socket');
      socket.emit('call-answer', answerData);
      
      // ✅ Log transceiver state at answer time
      const transceivers = pc.getTransceivers();
      console.log('[CALL PAGE] 📡 Transceivers at answer time:', transceivers.length);
      transceivers.forEach((t, i) => {
        console.log(`[CALL PAGE] 📡 T${i}: ${t.receiver?.track?.kind} dir:${t.direction} sender:${!!t.sender?.track}`);
      });
      
      setIncomingCall(null);
      console.log('[CALL PAGE] ✅ Call answered successfully');
      
    } catch (error) {
      console.error('[CALL PAGE] ❌ Answer call error:', error);
      alert(`❌ Failed to answer call: ${error}`);
    }
  }, [socket, incomingCall, isConnected, user]);

  const handleEndCall = useCallback(() => {
    console.log('[CALL PAGE] 📞 Ending call');
    
    if (incomingCall?.callId && socket) {
      socket.emit('call-end', { 
        callId: incomingCall.callId, 
        targetId: isOutgoingCall ? targetUserId.trim() : incomingCall.callerId 
      });
    }
    
    setIncomingCall(null);
    setIsOutgoingCall(false);
    
    currentCallIdRef.current = null;
    currentTargetIdRef.current = null;
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamState) {
      localStreamState.getTracks().forEach(track => track.stop());
      setLocalStreamState(null);
    }
    
    setRemoteStreamState(null);
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    endCall(socket);
  }, [socket, isConnected, incomingCall, isOutgoingCall, targetUserId, localStreamState, endCall]);

  const handleToggleMute = useCallback(() => {
    toggleMute();
    
    if (localStreamState) {
      const audioTracks = localStreamState.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [toggleMute, localStreamState]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    
    if (localStreamState) {
      const videoTracks = localStreamState.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [toggleVideo, localStreamState]);

  const handleRetryConnection = useCallback(() => {
    setReconnectAttempts(prev => prev + 1);
    reconnect();
  }, [reconnect]);

  const getConnectionStatus = (): ConnectionStatus => {
    if (!user || !accessToken) return { status: 'no-auth', text: 'Not Authenticated', color: 'text-red-400' };
    if (isConnected) return { status: 'connected', text: 'Connected', color: 'text-green-400' };
    if (reconnectAttempts > 0) return { status: 'reconnecting', text: `Reconnecting... (${reconnectAttempts})`, color: 'text-yellow-400' };
    return { status: 'disconnected', text: 'Disconnected', color: 'text-red-400' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Wasaa Calls - Fixed
            </h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${connectionStatus.color}`}>
                {connectionStatus.status === 'connected' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : connectionStatus.status === 'reconnecting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{connectionStatus.text}</span>
              </div>
              {!isConnected && (
                <button
                  onClick={handleRetryConnection}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error display */}
        {connectionError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connection Issues:</p>
                <p className="text-sm">
                  • {typeof connectionError === 'string' ? connectionError : 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {user && accessToken && (
          <>
            {(isLoadingHistory || isLoadingCalls || isConnecting) && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isConnecting ? 'Connecting call...' : 'Loading call data...'}
                  </span>
                </div>
              </div>
            )}

            {/* ✅ Enhanced Debug Status */}
            <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
              <h4 className="text-yellow-300 font-medium mb-2">🔧 Debug Status</h4>
              <div className="text-sm text-yellow-200 space-y-1">
                <div>Local Stream: {localStreamState ? '✅ Active' : '❌ None'}</div>
                <div>Remote Stream: {remoteStreamState ? '✅ Active' : '❌ None'}</div>
                <div>Peer Connection: {peerConnectionRef.current ? `✅ ${peerConnectionRef.current.connectionState}` : '❌ None'}</div>
                <div>Call State: {incomingCall ? (isOutgoingCall ? '📞 Outgoing' : '📲 Incoming') : 'None'}</div>
                <div>Signaling: {peerConnectionRef.current ? peerConnectionRef.current.signalingState : 'N/A'}</div>
                <div>ICE: {peerConnectionRef.current ? peerConnectionRef.current.iceConnectionState : 'N/A'}</div>
              </div>
            </div>

            {/* ✅ FIXED Video Streams */}
            {(isInCall || incomingCall || localStreamState) && (
              <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Video Call</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local video */}
                  <div className="relative">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">You</h4>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ transform: 'scaleX(-1)' }}
                      className="w-full aspect-video rounded-lg border border-gray-700 bg-gray-900 object-cover"
                    />
                  </div>
                  {/* Remote video */}
                  <div className="relative">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Remote User</h4>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-video rounded-lg border border-gray-700 bg-gray-900 object-cover"
                    />
                    {!remoteStreamState && (
                      <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-gray-500 mx-auto mb-2 animate-spin" />
                          <p className="text-gray-500 text-sm">Waiting for remote video...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Call Controls */}
            {(isInCall || localStreamState) && (
              <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Call Controls</h3>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleToggleMute}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  
                  <button
                    onClick={handleToggleVideo}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
                      isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    {isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                  </button>
                  
                  <button
                    onClick={handleEndCall}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Call
                  </button>
                </div>
              </div>
            )}

            {/* Call Initiation Controls */}
            {!isInCall && !incomingCall && !localStreamState && (
              <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Start a Call</h3>
                <div className="grid gap-4">
                  <div>
                    <label htmlFor="targetUserId" className="block text-sm font-medium text-gray-300">
                      Target User ID
                    </label>
                    <input
                      id="targetUserId"
                      type="text"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="mt-1 w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartVideoCall}
                      disabled={isConnecting}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      Start Video Call
                    </button>
                    <button
                      onClick={handleStartAudioCall}
                      disabled={isConnecting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                      Start Audio Call
                    </button>
                  </div>
                  <div>
                    <label htmlFor="groupUserIds" className="block text-sm font-medium text-gray-300">
                      Group User IDs (comma-separated)
                    </label>
                    <input
                      id="groupUserIds"
                      type="text"
                      value={groupUserIds}
                      onChange={(e) => setGroupUserIds(e.target.value)}
                      className="mt-1 w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter user IDs (e.g., user1,user2)"
                    />
                  </div>
                  <button
                    onClick={handleStartGroupCall}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                  >
                    Start Group Call
                  </button>
                </div>
              </div>
            )}

            {/* Incoming/Outgoing Call Notification */}
            {incomingCall && !isInCall && (
              <div className={`mb-8 p-6 ${
                isOutgoingCall 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' 
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
              } rounded-xl ${isOutgoingCall ? '' : 'animate-pulse'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isOutgoingCall ? 'text-blue-300' : 'text-green-300'
                    }`}>
                      {isOutgoingCall ? '📞 Calling...' : '📞 Incoming Call'}
                    </h3>
                    <p className="text-gray-300">
                      {isOutgoingCall 
                        ? `Calling: ${targetUserId || 'Unknown'}` 
                        : `From: ${incomingCall.callerName || incomingCall.callerId || 'Unknown'}`
                      }
                    </p>
                    <p className="text-sm text-gray-400">{incomingCall.callType || 'Unknown'} call</p>
                  </div>
                  <div className="flex gap-2">
                    {!isOutgoingCall && (
                      <button
                        onClick={handleAnswerCall}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                      >
                        <PhoneCall className="w-5 h-5" />
                        Answer
                      </button>
                    )}
                    <button
                      onClick={handleEndCall}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
                    >
                      <PhoneOff className="w-5 h-5" />
                      {isOutgoingCall ? 'Cancel' : 'Decline'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Call History */}
            {!isInCall && !incomingCall && !localStreamState && (
              <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Call History</h3>
                {callHistory.length > 0 ? (
                  <ul className="text-gray-300 space-y-2">
                    {callHistory.map((call: CallHistory, index: number) => {
                      const displayName = call.otherPartyName || call.participantName || 'Unknown User';
                      const callType = call.type || call.callType || 'unknown';
                      const direction = call.direction || 'unknown';

                      let displayTime = 'N/A';
                      if (call.initiatedAt) {
                        try {
                          displayTime = new Date(call.initiatedAt).toLocaleString();
                        } catch (e) {
                          displayTime = 'Invalid date';
                        }
                      }

                      const formatDuration = (seconds: number) => {
                        if (!seconds || seconds === 0) return 'N/A';
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                      };

                      return (
                        <li key={call.id || index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{displayName}</span>
                                <span className="text-sm px-2 py-1 rounded text-blue-400">
                                  {direction}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>📹 {callType}</span>
                                <span>⏱️ {formatDuration(call.duration)}</span>
                                <span>📅 {displayTime}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-lg">📭 No call history available</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallPage;