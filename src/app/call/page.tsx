'use client';

import { useEffect, useCallback } from 'react';
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
  CheckCircle
} from 'lucide-react';

const CallPage = () => {
  const { user } = useAuthStore();
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
    callHistory
  } = useCallStore();
  
  const { socket, isConnected, connectionError } = useSocket({
    userId: user?.id,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      console.log('[CALL PAGE] Initializing for user:', user.id);
      fetchCallHistory().catch((error: Error) => console.error('Fetch error:', error));
    }
  }, [user, fetchCallHistory]);

  const handleStartCall = useCallback(() => {
    if (!user?.id || !socket) return;
    startCall('target-user-id', 'video', socket).catch((error: Error) => console.error('Start call error:', error));
  }, [socket, startCall, user]);

  const handleStartGroupCall = useCallback(() => {
    if (!user?.id || !socket) return;
    startGroupCall(['target-user-id-1', 'target-user-id-2'], 'video', socket).catch((error: Error) => console.error('Start group call error:', error));
  }, [socket, startGroupCall, user]);

  const handleAnswerCall = useCallback(() => {
    if (!socket) return;
    answerCall(socket).catch((error: Error) => console.error('Answer call error:', error));
  }, [socket, answerCall]);

  const handleEndCall = useCallback(() => {
    if (!socket) return;
    endCall(socket);
  }, [socket, endCall]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Wasaa Calls
            </h1>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {connectionError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Error: {connectionError}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingHistory && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading call history...</span>
            </div>
          </div>
        )}

        {/* Current Call Status */}
        {(isInCall || isConnecting) && currentCall && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-300">
                  {isConnecting ? 'Connecting...' : 'In Call'}
                </h3>
                <p className="text-gray-300">
                  {currentCall.isGroupCall ? 'Group Call' : '1-on-1 Call'} • {currentCall.callType}
                </p>
                <p className="text-sm text-gray-400">
                  {currentCall.participants.length} participant(s)
                </p>
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

        {/* Call Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Start Voice Call */}
          <button
            onClick={handleStartCall}
            disabled={!isConnected || isInCall}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
              <PhoneCall className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-green-300">Start Call</h3>
              <p className="text-sm text-gray-400">Voice/Video call</p>
            </div>
          </button>

          {/* Start Group Call */}
          <button
            onClick={handleStartGroupCall}
            disabled={!isConnected || isInCall}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-blue-300">Group Call</h3>
              <p className="text-sm text-gray-400">Multi-participant</p>
            </div>
          </button>

          {/* Answer Call */}
          <button
            onClick={handleAnswerCall}
            disabled={!isConnected || !currentCall}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
              <Phone className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-purple-300">Answer Call</h3>
              <p className="text-sm text-gray-400">Accept incoming</p>
            </div>
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            disabled={!isConnected}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/30 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-red-500/20 rounded-full group-hover:bg-red-500/30 transition-colors">
              <PhoneOff className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-red-300">End Call</h3>
              <p className="text-sm text-gray-400">Hang up</p>
            </div>
          </button>
        </div>

        {/* Call History */}
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Calls</h2>
          
          {callHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No call history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {callHistory.map((call) => (
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
                      <p className="font-medium text-gray-200">{call.participantName}</p>
                      <p className="text-sm text-gray-400">
                        {call.type} • {call.callType} • {call.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {call.timestamp.toLocaleTimeString()}
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
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-lg border border-white/20 rounded-full p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {/* toggle mute logic */}}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => {/* toggle video logic */}}
                className={`p-3 rounded-full transition-colors ${
                  !isVideoEnabled 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleEndCall}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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