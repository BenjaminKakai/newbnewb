// src/providers/CallUI.tsx
import React, { useRef, useEffect } from 'react';
import { useCallStore } from '@/store/callStore';
import { useCall } from '@/hooks/call/useCall';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Minimize2 } from 'lucide-react';

const CallUI: React.FC = () => {
  const {
    currentCall,
    isInCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isSpeakerOn,
    showAcceptButton,
  } = useCallStore();
  const { answerCall, declineCall, hangUpCall, toggleMute, toggleVideo } = useCall();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const lastRemoteStreamId = useRef<string | null>(null);
  const lastLocalStreamId = useRef<string | null>(null);

  // CRITICAL FIX: Enhanced local stream handling with debouncing
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const streamId = localStream.id;
      
      // Only update if stream changed to prevent autoplay interruptions
      if (lastLocalStreamId.current !== streamId) {
        console.log('🎥 Attaching local stream:', {
          streamId,
          tracks: localStream.getTracks().map(t => ({ 
            kind: t.kind, 
            id: t.id, 
            enabled: t.enabled, 
            readyState: t.readyState 
          }))
        });
        
        localVideoRef.current.srcObject = localStream;
        lastLocalStreamId.current = streamId;
        
        // Only play if video call and has video tracks
        if (currentCall?.callType === 'video' && localStream.getVideoTracks().length > 0) {
          // Use requestAnimationFrame to avoid interruption
          requestAnimationFrame(() => {
            localVideoRef.current?.play().catch(e => {
              console.warn('⚠️ Local video autoplay prevented (normal behavior):', e.message);
            });
          });
        }
      }
    } else if (localVideoRef.current && !localStream) {
      console.log('🎥 Clearing local stream');
      localVideoRef.current.srcObject = null;
      lastLocalStreamId.current = null;
    }
  }, [localStream, currentCall?.callType]);

  // CRITICAL FIX: Enhanced remote stream handling with debouncing
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      const streamId = remoteStream.id;
      
      // Only update if stream changed to prevent autoplay interruptions
      if (lastRemoteStreamId.current !== streamId) {
        console.log('🎥 Attaching remote stream:', {
          streamId,
          tracks: remoteStream.getTracks().map(t => ({ 
            kind: t.kind, 
            id: t.id, 
            enabled: t.enabled, 
            readyState: t.readyState 
          }))
        });
        
        remoteVideoRef.current.srcObject = remoteStream;
        lastRemoteStreamId.current = streamId;
        
        // Only play if video call and has video tracks
        if (currentCall?.callType === 'video' && remoteStream.getVideoTracks().length > 0) {
          // Use requestAnimationFrame to avoid interruption
          requestAnimationFrame(() => {
            remoteVideoRef.current?.play().catch(e => {
              console.warn('⚠️ Remote video autoplay prevented (normal behavior):', e.message);
            });
          });
        }
      }
    } else if (remoteVideoRef.current && !remoteStream) {
      console.log('🎥 Clearing remote stream');
      remoteVideoRef.current.srcObject = null;
      lastRemoteStreamId.current = null;
    }
  }, [remoteStream, currentCall?.callType]);

  // Don't render if not in call and no incoming call
  if (!isInCall && !showAcceptButton) return null;

  const hasRemoteVideo = currentCall?.callType === 'video' && 
                        remoteStream && 
                        remoteStream.getVideoTracks().length > 0 &&
                        remoteStream.getVideoTracks().some(track => track.enabled);

  const hasLocalVideo = currentCall?.callType === 'video' && 
                       localStream && 
                       localStream.getVideoTracks().length > 0 &&
                       localStream.getVideoTracks().some(track => track.enabled);

  const handleMinimize = () => {
    // Just hide the UI without affecting call state
    console.log('🔽 Minimizing call UI');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="bg-black bg-opacity-50 p-4 flex justify-between items-center text-white">
          <div>
            <h3 className="font-semibold">
              {currentCall?.participants[0]?.name || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-300 capitalize">
              {currentCall?.status} • {currentCall?.callType}
              {remoteStream && ` • ${remoteStream.getTracks().length} tracks`}
            </p>
          </div>
          <button 
            onClick={handleMinimize} 
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <Minimize2 size={20} />
          </button>
        </div>

        {/* Main video area */}
        <div className="flex-1 relative">
          {hasRemoteVideo ? (
            // REMOTE VIDEO DISPLAY
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
              onLoadedMetadata={() => console.log('📺 Remote video metadata loaded')}
              onCanPlay={() => console.log('📺 Remote video can play')}
              onPlay={() => console.log('📺 Remote video playing')}
              onError={(e) => console.error('❌ Remote video error:', e)}
            />
          ) : (
            // AUDIO-ONLY OR NO REMOTE STREAM DISPLAY
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">
                    {currentCall?.participants[0]?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <p className="text-lg">{currentCall?.participants[0]?.name || 'Unknown'}</p>
                <p className="text-gray-400 capitalize">{currentCall?.status}</p>
                {currentCall?.callType === 'video' && !hasRemoteVideo && (
                  <p className="text-sm text-gray-500 mt-2">
                    {remoteStream ? 'Video disabled' : 'Connecting...'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          {hasLocalVideo && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white border-opacity-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
                onLoadedMetadata={() => console.log('📺 Local video metadata loaded')}
                onCanPlay={() => console.log('📺 Local video can play')}
                onPlay={() => console.log('📺 Local video playing')}
                onError={(e) => console.error('❌ Local video error:', e)}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <VideoOff size={16} className="text-white" />
                </div>
              )}
            </div>
          )}

          {/* Local video placeholder when disabled */}
          {currentCall?.callType === 'video' && !hasLocalVideo && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-gray-500 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}

          {/* Connection status overlay */}
          {currentCall?.status === 'connecting' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black bg-opacity-50 p-6">
          <div className="flex justify-center space-x-6">
            {showAcceptButton ? (
              // INCOMING CALL CONTROLS
              <>
                <button
                  onClick={answerCall}
                  className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg"
                  aria-label="Answer call"
                >
                  <Phone size={24} className="text-white" />
                </button>
                <button
                  onClick={declineCall}
                  className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                  aria-label="Decline call"
                >
                  <PhoneOff size={24} className="text-white" />
                </button>
              </>
            ) : (
              // ACTIVE CALL CONTROLS
              <>
                {/* Mute button */}
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-colors shadow-lg ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <MicOff size={24} className="text-white" />
                  ) : (
                    <Mic size={24} className="text-white" />
                  )}
                </button>

                {/* End call button */}
                <button
                  onClick={hangUpCall}
                  className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                  aria-label="End call"
                >
                  <PhoneOff size={24} className="text-white" />
                </button>

                {/* Video toggle (only for video calls) */}
                {currentCall?.callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-colors shadow-lg ${
                      !isVideoEnabled 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  >
                    {isVideoEnabled ? (
                      <Video size={24} className="text-white" />
                    ) : (
                      <VideoOff size={24} className="text-white" />
                    )}
                  </button>
                )}

                {/* Speaker toggle */}
                <button
                  onClick={() => useCallStore.getState().toggleSpeaker()}
                  className={`p-4 rounded-full transition-colors shadow-lg ${
                    isSpeakerOn 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  aria-label={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
                >
                  {isSpeakerOn ? (
                    <Volume2 size={24} className="text-white" />
                  ) : (
                    <VolumeX size={24} className="text-white" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallUI;