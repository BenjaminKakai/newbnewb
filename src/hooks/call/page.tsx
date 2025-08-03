'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCallStore } from '@/store/callStore';
import { useSocket } from '@/hooks/useSocket';
import { 
  Phone, 
  PhoneCall, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

const CallPage = () => {
  const { user, token } = useAuthStore();
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
    error: callError
  } = useCallStore();
  
  // 🔧 FIXED: Enhanced socket connection with proper auth
  const { socket, isConnected, connectionError, reconnectAttempts } = useSocket({
    userId: user?.id,
    enabled: !!user && !!token,
  });

  const [targetUserId, setTargetUserId] = useState('');
  const [groupUserIds, setGroupUserIds] = useState('');
  const [incomingCall, setIncomingCall] = useState<Record<string, unknown> | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Array<{id: string, stream: MediaStream}>>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{[key: string]: HTMLVideoElement}>({});

  // 🔧 FIXED: Enhanced initialization with better error handling
  useEffect(() => {
    if (!user || !token) {
      console.log('[CALL PAGE] 🚫 No user or token available');
      return;
    }

    console.log('[CALL PAGE] 🚀 Initializing for user:', user?.id);
    
    // 🔧 FIXED: Safe call history fetch with error handling
    const loadCallHistory = async () => {
      try {
        setIsLoadingCalls(true);
        await fetchCallHistory();
        console.log('[CALL PAGE] ✅ Call history loaded successfully');
      } catch (error: unknown) {
        console.error('[CALL PAGE] ❌ Failed to load call history:', error);
        // Don't show error for call history as it's not critical
      } finally {
        setIsLoadingCalls(false);
      }
    };

    loadCallHistory();
  }, [user, token, fetchCallHistory]);

  // 🔧 FIXED: Enhanced socket event handling
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[CALL PAGE] 🔌 Socket not ready:', { hasSocket: !!socket, isConnected });
      return;
    }

    console.log('[CALL PAGE] 🎧 Setting up socket listeners for user:', user?.id);

    const handleCallOffer = (data: Record<string, unknown>) => {
      console.log('[CALL PAGE] 📞 Received call-offer:', data);
      setIncomingCall(data);
    };

    const handleCallAnswer = (data: Record<string, unknown>) => {
      console.log('[CALL PAGE] 📞 Received call-answer:', data);
      setIncomingCall(null);
    };

    const handleCallEnd = (data: Record<string, unknown>) => {
      console.log('[CALL PAGE] 📞 Call ended:', data);
      setIncomingCall(null);
      handleCleanupStreams();
    };

    const handleSocketError = (error: unknown) => {
      console.error('[CALL PAGE] 🚨 Socket error:', error);
    };

    // Add event listeners
    socket.on('call-offer', handleCallOffer);
    socket.on('call-answer', handleCallAnswer);
    socket.on('call-end', handleCallEnd);
    socket.on('error', handleSocketError);

    return () => {
      console.log('[CALL PAGE] 🧹 Cleaning up socket listeners');
      socket.off('call-offer', handleCallOffer);
      socket.off('call-answer', handleCallAnswer);
      socket.off('call-end', handleCallEnd);
      socket.off('error', handleSocketError);
    };
  }, [socket, isConnected, user]);

  // 🔧 FIXED: Enhanced stream management
  const handleCleanupStreams = useCallback(() => {
    if (localStream) {
      console.log('[CALL PAGE] 🧹 Stopping local stream tracks');
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStreams([]);
  }, [localStream]);

  // 🔧 FIXED: Handle local and remote video streams
  useEffect(() => {
    if (!currentCall || !isInCall) {
      console.log('[CALL PAGE] 🔄 No active call, clearing streams');
      handleCleanupStreams();
      return;
    }

    // Handle local stream
    const stream = currentCall.stream;
    if (stream && stream !== localStream) {
      console.log('[CALL PAGE] 📹 Setting local stream:', stream.id);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }

    // Handle peer connection for remote streams
    const peerConnection = currentCall.peerConnection;
    if (peerConnection) {
      console.log('[CALL PAGE] 🔗 Setting up peerConnection.ontrack');
      peerConnection.ontrack = (event) => {
        console.log('[CALL PAGE] 📹 Received remote stream:', event.streams[0].id);
        const stream = event.streams[0];
        const participantId = currentCall.participants[0]?.id || 'unknown';
        setRemoteStreams((prev) => {
          const exists = prev.some(s => s.id === participantId);
          if (exists) return prev;
          return [...prev, { id: participantId, stream }];
        });
      };
    }

    return () => {
      // Cleanup handled by handleCleanupStreams
    };
  }, [currentCall, isInCall, localStream, handleCleanupStreams]);

  // 🔧 FIXED: Update remote video elements
  useEffect(() => {
    remoteStreams.forEach(({ id, stream }) => {
      const videoElement = remoteVideoRefs.current[id];
      if (videoElement && videoElement.srcObject !== stream) {
        console.log('[CALL PAGE] 📹 Attaching remote stream to video element:', id);
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // 🔧 FIXED: Enhanced call handlers with better error handling
  const handleStartVideoCall = useCallback(async () => {
    if (!user?.id || !isConnected) {
      alert('❌ User or socket not available');
      return;
    }
    if (!targetUserId.trim()) {
      alert('⚠️ Please enter a target user ID');
      return;
    }
    
    try {
      console.log(`[CALL PAGE] 📞 Starting video call to ${targetUserId}`);
      await startCall(targetUserId.trim(), 'video', socket);
    } catch (error: unknown) {
      console.error('[CALL PAGE] ❌ Start video call error:', error);
      alert(`❌ Failed to start video call: ${error.message}`);
    }
  }, [socket, startCall, user, targetUserId, isConnected]);

  const handleStartAudioCall = useCallback(async () => {
    if (!user?.id || !isConnected) {
      alert('❌ User or socket not available');
      return;
    }
    if (!targetUserId.trim()) {
      alert('⚠️ Please enter a target user ID');
      return;
    }
    
    try {
      console.log(`[CALL PAGE] 📞 Starting audio call to ${targetUserId}`);
      await startCall(targetUserId.trim(), 'voice', socket);
    } catch (error: unknown) {
      console.error('[CALL PAGE] ❌ Start audio call error:', error);
      alert(`❌ Failed to start audio call: ${error.message}`);
    }
  }, [socket, startCall, user, targetUserId, isConnected]);

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
      console.log(`[CALL PAGE] 👥 Starting group video call to ${userIds.join(', ')}`);
      await startGroupCall(userIds, 'video', socket);
    } catch (error: unknown) {
      console.error('[CALL PAGE] ❌ Start group call error:', error);
      alert(`❌ Failed to start group call: ${error.message}`);
    }
  }, [socket, startGroupCall, user, groupUserIds, isConnected]);

  const handleAnswerCall = useCallback(async () => {
    if (!isConnected || !incomingCall) {
      alert('❌ No incoming call or socket not available');
      return;
    }
    
    try {
      console.log('[CALL PAGE] 📞 Answering call:', incomingCall.callId);
      await answerCall(socket);
      setIncomingCall(null);
    } catch (error: unknown) {
      console.error('[CALL PAGE] ❌ Answer call error:', error);
      alert(`❌ Failed to answer call: ${error.message}`);
    }
  }, [socket, answerCall, incomingCall, isConnected]);

  const handleEndCall = useCallback(() => {
    if (!isConnected) {
      console.warn('[CALL PAGE] ⚠️ Socket not connected, cleaning up locally');
    }
    
    console.log('[CALL PAGE] 📞 Ending call');
    endCall(socket);
    setIncomingCall(null);
    handleCleanupStreams();
  }, [socket, endCall, isConnected, handleCleanupStreams]);

  const handleToggleMute = useCallback(() => {
    console.log('[CALL PAGE] 🔇 Toggling mute:', !isMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  const handleToggleVideo = useCallback(() => {
    console.log('[CALL PAGE] 📹 Toggling video:', !isVideoEnabled);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  }, [isVideoEnabled, localStream]);

  // 🔧 FIXED: Retry connection handler
  const handleRetryConnection = useCallback(() => {
    window.location.reload();
  }, []);

  // 🔧 FIXED: Determine connection status
  const getConnectionStatus = () => {
    if (!user || !token) return { status: 'no-auth', text: 'Not Authenticated', color: 'text-red-400' };
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
              Wasaa Calls
            </h1>
            <div className="flex items-center gap-4">
              {/* 🔧 FIXED: Enhanced connection status */}
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
              
              {/* Retry button for failed connections */}
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
        {/* 🔧 FIXED: Enhanced error display */}
        {(connectionError || callError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connection Issues:</p>
                {connectionError && <p className="text-sm">• {connectionError}</p>}
                {callError && <p className="text-sm">• {callError}</p>}
                <p className="text-xs mt-1 text-red-300">
                  Check your internet connection and server status
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Warning */}
        {(!user || !token) && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-5 h-5" />
              <span>Please login to use the calling features</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isLoadingHistory || isLoadingCalls) && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading call data...</span>
            </div>
          </div>
        )}

        {/* Incoming Call Notification */}
        {incomingCall && !isInCall && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-300">📞 Incoming Call</h3>
                <p className="text-gray-300">From: {incomingCall.callerName || incomingCall.callerId || 'Unknown'}</p>
                <p className="text-sm text-gray-400">{incomingCall.callType} call</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAnswerCall}
                  disabled={!isConnected}
                  className="flex items-center gap-3 p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">Answer</span>
                </button>
                <button
                  onClick={() => setIncomingCall(null)}
                  className="flex items-center gap-3 p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all duration-300"
                >
                  <PhoneOff className="w-5 h-5 text-red-400" />
                  <span className="text-red-300">Decline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        {(isInCall || isConnecting) && currentCall && (
          <div className="mb-8 p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">
              {currentCall.callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Video */}
              {localStream && currentCall.callType === 'video' && (
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-black rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    You ({user?.name || user?.email || 'Unknown'})
                  </div>
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <VideoOff className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Remote Videos */}
              {remoteStreams.map(({ id }) => (
                <div key={id} className="relative">
                  <video
                    ref={(el) => { 
                      if (el) remoteVideoRefs.current[id] = el; 
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    {currentCall.participants.find(p => p.id === id)?.name || id}
                  </div>
                </div>
              ))}
              
              {/* Placeholder for remote participant */}
              {remoteStreams.length === 0 && currentCall.participants.length > 0 && (
                <div className="relative">
                  <div className="w-full h-64 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                      <p>Waiting for {currentCall.participants[0]?.name || 'participant'}...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call Initiation Controls */}
        <div className="mb-8 p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">🚀 Start a Call</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Target User ID (1-on-1 Call)
              </label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID (e.g., e8c7507f-2d69-4401-ab07-6a24325fb66b)"
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={!isConnected}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStartVideoCall}
                disabled={!isConnected || isInCall || !targetUserId.trim() || !user}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="p-3 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
                  <Video className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-green-300">Start Video Call</h3>
                  <p className="text-sm text-gray-400">1-on-1 video</p>
                </div>
              </button>
              <button
                onClick={handleStartAudioCall}
                disabled={!isConnected || isInCall || !targetUserId.trim() || !user}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
                  <PhoneCall className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-blue-300">Start Audio Call</h3>
                  <p className="text-sm text-gray-400">1-on-1 voice</p>
                </div>
              </button>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Group Call User IDs (comma-separated)</label>
              <input
                type="text"
                value={groupUserIds}
                onChange={(e) => setGroupUserIds(e.target.value)}
                placeholder="Enter user IDs (e.g., id1,id2,id3)"
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={!isConnected}
              />
            </div>
            <button
              onClick={handleStartGroupCall}
              disabled={!isConnected || isInCall || !groupUserIds.trim() || !user}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="p-3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-purple-300">Start Group Call</h3>
                <p className="text-sm text-gray-400">Multi-participant video</p>
              </div>
            </button>
          </div>
        </div>

        {/* Current Call Status */}
        {(isInCall || isConnecting) && currentCall && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-300">
                  {isConnecting ? '🔄 Connecting...' : '📞 In Call'}
                </h3>
                <p className="text-gray-300">
                  {currentCall.isGroupCall ? '👥 Group Call' : '👤 1-on-1 Call'} • {currentCall.callType}
                </p>
                <p className="text-sm text-gray-400">
                  {currentCall.participants.map(p => p.name || 'Unknown').join(', ')} ({currentCall.participants.length} participant(s))
                </p>
                {currentCall.roomName && (
                  <p className="text-sm text-purple-300">Room: {currentCall.roomName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isConnecting && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                {currentCall.callType === 'video' ? (
                  <Video className="w-6 h-6 text-purple-400" />
                ) : (
                  <Phone className="w-6 h-6 text-purple-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Call History */}
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">📋 Recent Calls</h2>
          {callHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No call history yet</p>
              <p className="text-sm mt-1">Your recent calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {callHistory.slice(0, 10).map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      call.type === 'incoming' 
                        ? 'bg-green-500/20 text-green-400' 
                        : call.type === 'outgoing'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {call.callType === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">{call.participantName || call.participantId || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">
                        {call.type} • {call.callType} • {call.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {call.timestamp ? new Date(call.timestamp).toLocaleTimeString() : ''}
                    </p>
                    {call.duration && call.duration > 0 && (
                      <p className="text-xs text-gray-400">
                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call Controls (when in call) */}
        {isInCall && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-lg border border-white/20 rounded-full p-4 z-50">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              {currentCall?.callType === 'video' && (
                <button
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    !isVideoEnabled 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}
              
              <button
                onClick={handleEndCall}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                title="End call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;