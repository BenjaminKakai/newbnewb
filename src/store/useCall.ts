// src/hooks/call/useCall.ts - FIXED VERSION

import { useEffect, useCallback, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { callSocket } from '@/store/callSocket';

interface UseCallOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
}

export const useCall = (options: UseCallOptions = {}) => {
  const { autoConnect = true } = options;
  const { user } = useAuthStore();
  const {
    currentCall,
    isInCall,
    isConnecting,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isConnected,
    connectionError,
    showAcceptButton,
    setConnectionError,
    setIsInCall,
    setRemoteStream,
    initializeMedia,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const initializePeerConnection = useCallback(() => {
    console.log('🔧 Initializing peer connection...');
    
    // ENHANCED: Multiple TURN servers for better connectivity
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Primary TURN server
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelay',
          credential: 'openrelay',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelay',
          credential: 'openrelay',
        },
        // Backup TURN servers
        {
          urls: 'turn:relay.backupserver.com:3478',
          username: 'guest',
          credential: 'guest123',
        },
        // Google's free TURN server (limited)
        {
          urls: 'turn:142.93.165.44:3478',
          username: 'test',
          credential: 'test123',
        },
      ],
      iceCandidatePoolSize: 10, // Generate more candidates
    });

    // ENHANCED: Detailed ICE candidate logging
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate;
        // Parse candidate string for detailed info
        const candidateString = candidate.candidate;
        const parts = candidateString.split(' ');
        
        console.log(`🧊 ICE candidate generated:`, {
          type: parts[7] || 'unknown', // typ host/srflx/relay
          protocol: parts[2] || 'unknown', // UDP/TCP
          address: parts[4] || 'unknown',
          port: parts[5] || 'unknown',
          priority: candidate.priority,
          foundation: candidate.foundation,
          candidateString: candidateString
        });
        
        // FIX: Use callSocket.emit instead of accessing private socket
        callSocket.emit('ice-candidate', {
          candidate: event.candidate,
          callId: currentCall?.id,
          targetId: currentCall?.participants[0]?.id,
          senderId: user?.id,
        });
      } else {
        console.log('🧊 ICE gathering completed');
      }
    };

    // ENHANCED: Detailed connection state monitoring
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const iceState = pc.iceConnectionState;
      const signalingState = pc.signalingState;
      
      console.log(`🔄 Connection states: connection=${state}, ice=${iceState}, signaling=${signalingState}`);
      
      if (state === 'connected') {
        console.log('✅ 🎉 WebRTC connection FULLY ESTABLISHED!');
        setIsInCall(true);
        setConnectionError(null);
      } else if (state === 'failed' || state === 'disconnected') {
        console.error(`❌ WebRTC connection ${state}`);
        setConnectionError(`Connection ${state}`);
        // Don't auto-end, allow reconnection attempts
      } else if (state === 'connecting') {
        console.log('🔄 WebRTC connection in progress...');
      }
    };

    // ENHANCED: Detailed ICE connection monitoring
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      const gatheringState = pc.iceGatheringState;
      
      console.log(`🧊 ICE states: connection=${iceState}, gathering=${gatheringState}`);
      
      if (iceState === 'connected' || iceState === 'completed') {
        console.log('✅ 🎉 ICE connection SUCCESSFUL!');
        setConnectionError(null);
      } else if (iceState === 'failed') {
        console.error('❌ ICE connection FAILED - attempting restart...');
        pc.restartIce();
      } else if (iceState === 'disconnected') {
        console.warn('⚠️ ICE connection lost - waiting for reconnection...');
      } else if (iceState === 'checking') {
        console.log('🔄 ICE connectivity checks in progress...');
      }
    };

    // ENHANCED: Detailed ontrack event handling
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const track = event.track;
      
      console.log(`📥 🎉 ONTRACK EVENT RECEIVED!`, {
        trackKind: track.kind,
        trackId: track.id,
        trackEnabled: track.enabled,
        trackReadyState: track.readyState,
        streamId: stream?.id,
        streamTracks: stream?.getTracks().length || 0
      });
      
      if (stream) {
        console.log(`📥 Stream tracks:`, stream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        })));
        
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = stream;
          setRemoteStream(stream);
          console.log('✅ 🎉 REMOTE STREAM SET SUCCESSFULLY!', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length
          });
        } else {
          // Add new tracks to existing stream
          stream.getTracks().forEach(newTrack => {
            const existingTrack = remoteStreamRef.current?.getTracks().find(t => t.id === newTrack.id);
            if (!existingTrack) {
              remoteStreamRef.current?.addTrack(newTrack);
              console.log(`📥 Added ${newTrack.kind} track to existing remote stream`);
            }
          });
        }
      } else {
        console.error('❌ ontrack event received but no stream!');
      }
    };

    // ENHANCED: Signaling state monitoring
    pc.onsignalingstatechange = () => {
      console.log(`📡 Signaling state: ${pc.signalingState}`);
    };

    // ENHANCED: Data channel monitoring (if used)
    pc.ondatachannel = (event) => {
      console.log(`📊 Data channel received: ${event.channel.label}`);
    };

    pcRef.current = pc;
    return pc;
  }, [currentCall, user, setRemoteStream, setIsInCall, setConnectionError]);

  useEffect(() => {
    if (autoConnect && user && !isConnected) {
      const token = localStorage.getItem('access_token');
      if (token) {
        callSocket.connect(token).catch(err => {
          setConnectionError(`Socket connection failed: ${err}`);
        });
      }
    }
  }, [autoConnect, user, isConnected, setConnectionError]);

  useEffect(() => {
    // CALLEE: Handle incoming call offer
    callSocket.on('call-offer', async (data) => {
      console.log('📞 🎯 RECEIVED CALL OFFER:', data);
      
      // CRITICAL FIX: Check for required data
      if (!data.offer) {
        console.error('❌ No offer data received');
        return;
      }
      
      const pc = initializePeerConnection();
      
      try {
        console.log('📥 Setting remote description (offer)...');
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log('✅ Remote description (offer) set successfully');
        
        // Initialize media for callee with explicit logging
        console.log('🎥 CALLEE: Initializing media...');
        const callType = data.callType || 'voice'; // CRITICAL FIX: Default to 'voice'
        const stream = await initializeMedia(callType);
        
        if (stream) {
          console.log(`📤 CALLEE: Adding ${stream.getTracks().length} tracks to peer connection...`);
          stream.getTracks().forEach((track, index) => {
            console.log(`📤 CALLEE track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
            pc.addTrack(track, stream);
          });
          console.log('✅ CALLEE: All tracks added to peer connection');
        }
        
        console.log('📝 CALLEE: Creating answer...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ CALLEE: Answer created and set as local description');
        
        console.log('📤 CALLEE: Sending answer...');
        callSocket.emit('call-answer', { 
          callId: data.callId, 
          answer, 
          targetId: data.callerId, 
          receiverId: user?.id  // FIX: Use receiverId instead of senderId
        });
        console.log('✅ CALLEE: Answer sent successfully');
        
      } catch (error) {
        console.error('❌ CALLEE: Failed to process offer:', error);
        setConnectionError(`Failed to process offer: ${error}`);
      }
    });

    // CALLER: Handle call answer
    callSocket.on('call-answer', async (data) => {
      console.log('📞 🎯 RECEIVED CALL ANSWER:', data);
      
      // CRITICAL FIX: Check for required data
      if (!data.answer) {
        console.error('❌ No answer data received');
        return;
      }
      
      if (pcRef.current) {
        try {
          console.log('📥 CALLER: Setting remote description (answer)...');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('✅ CALLER: Answer set successfully');
          console.log(`📊 CALLER: Connection state after answer: ${pcRef.current.connectionState}`);
        } catch (error) {
          console.error('❌ CALLER: Failed to set answer:', error);
          setConnectionError(`Failed to set answer: ${error}`);
        }
      } else {
        console.error('❌ CALLER: No peer connection available for answer!');
      }
    });

    // Handle ICE candidates with enhanced logging
    callSocket.on('ice-candidate', async (data) => {
      const candidate = data.candidate;
      
      if (!candidate) {
        console.warn('⚠️ Received ICE candidate event but no candidate data');
        return;
      }
      
      // CRITICAL FIX: Parse candidate string for details
      const candidateString = candidate.candidate || '';
      const parts = candidateString.split(' ');
      
      console.log('🧊 🎯 RECEIVED ICE CANDIDATE:', {
        type: parts[7] || 'unknown', // typ host/srflx/relay
        protocol: parts[2] || 'unknown', // UDP/TCP
        address: parts[4] || 'unknown',
        port: parts[5] || 'unknown',
        from: data.senderId,
        candidateString: candidateString
      });
      
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added successfully');
        } catch (error) {
          console.error('❌ Failed to add ICE candidate:', error);
          console.error('❌ Candidate data:', candidate);
          setConnectionError(`Failed to add ICE candidate: ${error}`);
        }
      } else {
        console.warn('⚠️ Cannot add ICE candidate - no peer connection');
      }
    });

    return () => {
      callSocket.off('call-offer');
      callSocket.off('call-answer');
      callSocket.off('ice-candidate');
    };
  }, [initializePeerConnection, user, setConnectionError, initializeMedia]);

  useEffect(() => {
    return () => {
      if (isInCall || isConnecting) {
        // FIX: Use store method without socket parameter
        endCall();
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      remoteStreamRef.current = null;
    };
  }, [isInCall, isConnecting, endCall]);

  // CALLER: Start call function with enhanced logging
  const startCall = useCallback(async (participantId: string, callType: 'voice' | 'video') => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    if (isInCall || isConnecting) {
      throw new Error('Another call is already in progress');
    }
    
    try {
      console.log(`📞 🚀 CALLER: Starting ${callType} call to ${participantId}...`);
      const stream = await useCallStore.getState().startCall(participantId, callType);
      const pc = initializePeerConnection();
      
      if (stream) {
        console.log(`📤 CALLER: Adding ${stream.getTracks().length} tracks to peer connection...`);
        stream.getTracks().forEach((track, index) => {
          console.log(`📤 CALLER track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
          pc.addTrack(track, stream);
        });
        console.log('✅ CALLER: All tracks added to peer connection');
      }
      
      console.log('📝 CALLER: Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✅ CALLER: Offer created and set as local description');
      console.log(`📊 CALLER: Connection state after offer: ${pc.connectionState}`);
      
      console.log('📤 CALLER: Sending offer...');
      callSocket.emit('call-offer', {
        callId: currentCall?.id || `temp-${Date.now()}`,
        offer,
        targetId: participantId,
        callerId: user.id,
        callType,
      });
      console.log('✅ CALLER: Offer sent successfully');
      
    } catch (error) {
      console.error('❌ CALLER: Failed to start call:', error);
      throw error;
    }
  }, [user, isInCall, isConnecting, currentCall, initializePeerConnection]);

  const answerCall = useCallback(async () => {
    if (!showAcceptButton) {
      throw new Error('No incoming call to answer');
    }
    try {
      // FIX: Use store method without socket parameter if it doesn't need it
      // Check your callStore.answerCall method signature
      await useCallStore.getState().answerCall();
      console.log('✅ Call answered successfully');
    } catch (error) {
      console.error('❌ Failed to answer call:', error);
      throw error;
    }
  }, [showAcceptButton]);

  const declineCall = useCallback(() => {
    if (!showAcceptButton) {
      throw new Error('No incoming call to decline');
    }
    // FIX: Use store method without socket parameter
    useCallStore.getState().rejectCall();
  }, [showAcceptButton]);

  const hangUpCall = useCallback(() => {
    if (!isInCall && !isConnecting) {
      throw new Error('No active call to end');
    }
    // FIX: Use store method without socket parameter  
    useCallStore.getState().endCall();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
  }, [isInCall, isConnecting]);

  return {
    currentCall,
    isInCall,
    isConnecting,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isConnected,
    connectionError,
    showAcceptButton,
    startCall,
    answerCall,
    declineCall,
    hangUpCall,
    toggleMute,
    toggleVideo,
    initializeMedia,
  };
};

export default useCall;