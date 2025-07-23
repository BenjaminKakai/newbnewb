// Call.tsx - Integrated with media handling and call interface
"use client"
import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, 
  Phone, 
  Video, 
  PhoneMissed,
  Loader,
  Link as LinkIcon,
  MoreHorizontal,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Hand,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import { useCallSocket } from '@/store/callSocket';
import { useNotification } from './NotificationContext';
import SidebarNav from '@/components/SidebarNav';

interface CallHistoryItem {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  type: "incoming" | "outgoing" | "missed";
  callType: "voice" | "video";
  timestamp: Date;
  duration?: number;
  status: "completed" | "missed" | "failed";
}

const Call: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { contacts, getContactName, getContactAvatar } = useChatStore();
  const {
    callHistory,
    isLoadingHistory,
    currentTab,
    showDialPad,
    showNewCallModal,
    isConnected,
    currentCall,
    isInCall,
    isConnecting,
    localStream,
    isMuted,
    isVideoEnabled,
    handRaised,
    showAcceptButton,
    setCurrentTab,
    setShowDialPad,
    setShowNewCallModal,
    fetchCallHistory,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleHandRaise,
    shareScreen
  } = useCallStore();

  const { addNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Socket connection with logging
  const onLog = (message: string) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const { isConnected: socketConnected } = useCallSocket(accessToken, onLog);

  // Initialize call socket connection
  useEffect(() => {
    if (isAuthenticated && user?.id && accessToken) {
      console.log('[CALL PAGE] Initializing call socket...');
      // Fetch call history
      fetchCallHistory();
    }
  }, [isAuthenticated, user?.id, accessToken, fetchCallHistory]);

  // Setup local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true; // Prevent echo
    }
  }, [localStream]);

  const formatCallTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const handleCallContact = async (contactId: string, callType: 'voice' | 'video') => {
    try {
      await startCall(contactId, callType);
      addNotification(`Starting ${callType} call...`, 'info');
    } catch (err) {
      console.error('Failed to start call:', err);
      addNotification('Failed to start call', 'error');
    }
  };

  const handleRetryCall = async (historyItem: CallHistoryItem) => {
    try {
      await startCall(historyItem.participantId, historyItem.callType);
      addNotification('Retrying call...', 'info');
    } catch (err) {
      console.error('Failed to retry call:', err);
      addNotification('Failed to retry call', 'error');
    }
  };

  const handleAnswerCall = () => {
    answerCall();
    addNotification('Call answered', 'success');
  };

  const handleRejectCall = () => {
    rejectCall();
    addNotification('Call rejected', 'info');
  };

  const handleEndCall = () => {
    endCall();
    addNotification('Call ended', 'info');
  };

  const handleShareScreen = async () => {
    try {
      await shareScreen();
      addNotification('Screen sharing started', 'success');
    } catch (err) {
      console.error('Failed to share screen:', err);
      addNotification('Failed to share screen', 'error');
    }
  };

  const filteredCallHistory = callHistory.filter(call => {
    if (currentTab === 'missed') return call.status === 'missed';
    if (currentTab === 'pending') return call.status === 'completed' && call.type === 'outgoing';
    if (currentTab === 'requests') return call.type === 'incoming';
    return true;
  });

  const filteredContacts = contacts.filter(contact =>
    getContactName(contact.contact_id, user?.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render call interface when in call
  if (isInCall || currentCall) {
    return (
      <div className="h-screen bg-black flex flex-col">
        {/* Call Header */}
        <div className="p-4 text-white text-center">
          <h2 className="text-xl font-semibold">
            {currentCall?.participants[0]?.name || 'Unknown'}
          </h2>
          {/* <p className="text-sm opacity-75">
            {currentCall?.status === 'connecting' ? 'Connecting...' : 'Connected'}
          </p> */}
        </div>

        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Picture in Picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Hand Raised Indicator */}
          {handRaised && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
              ✋ Hand Raised
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="p-6 bg-gray-900">
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${!isVideoEnabled ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            
            <button
              onClick={handleShareScreen}
              className="p-4 rounded-full bg-gray-700 text-white hover:opacity-80 transition-opacity"
            >
              <Monitor className="w-6 h-6" />
            </button>
            
            <button
              onClick={toggleHandRaise}
              className={`p-4 rounded-full ${handRaised ? 'bg-yellow-500' : 'bg-gray-700'} text-white hover:opacity-80 transition-opacity`}
            >
              <Hand className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Accept/Reject for incoming calls */}
        {showAcceptButton && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button
              onClick={handleRejectCall}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <button
              onClick={handleAnswerCall}
              className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <Phone className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <SidebarNav onClose={() => {}} currentPath={pathname} />

      {/* Main Content */}
      <div className="flex flex-1 ml-20">
        {/* Left Panel - Contacts */}
        <div className="w-96 flex flex-col bg-white border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Contacts</h1>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search or start a new conversation"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 text-black border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Call History Tabs */}
            <div className="flex gap-2 mb-4">
              {(['missed', 'pending', 'requests'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    currentTab === tab
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 border border-blue-500 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'missed' && 'Missed call'}
                  {tab === 'pending' && 'Pending'}
                  {tab === 'requests' && 'Requests'}
                </button>
              ))}
            </div>
          </div>

          {/* Call History Section */}
          <div className="border-b border-gray-100">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : filteredCallHistory.length > 0 ? (
              <div className="px-4 py-2">
                {filteredCallHistory.slice(0, 4).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center space-x-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                    onClick={() => handleRetryCall(call)}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {call.participantAvatar ? (
                        <Image
                          src={call.participantAvatar}
                          alt={call.participantName}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                          {call.participantName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {call.participantName}
                      </h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {call.status === 'missed' && (
                          <PhoneMissed className="w-3 h-3 text-red-500" />
                        )}
                        {call.type === 'outgoing' && call.status === 'completed' && (
                          <Phone className="w-3 h-3 text-green-500" />
                        )}
                        {call.type === 'incoming' && (
                          <Phone className="w-3 h-3 text-blue-500" />
                        )}
                        <span>{call.status === 'missed' ? 'Missed call' : 'Call'}</span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-xs text-gray-500">
                      {formatCallTime(call.timestamp)}
                    </div>
                  </div>
                ))}

                {filteredCallHistory.length > 4 && (
                  <button className="w-full text-center py-2 text-blue-500 text-sm hover:text-blue-600">
                    See more
                  </button>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="text-2xl mb-2">📞</div>
                <p className="text-sm">No {currentTab} calls</p>
              </div>
            )}
          </div>

          {/* All Contacts Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">All Contacts</h2>
              
              {filteredContacts.length > 0 ? (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => {
                    const contactName = getContactName(contact.contact_id, user?.id);
                    const contactAvatar = getContactAvatar(contact.contact_id);
                    
                    return (
                      <div
                        key={contact.contact_id}
                        className="flex items-center space-x-3 py-3 hover:bg-gray-50 rounded-lg px-2"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          {contactAvatar ? (
                            <Image
                              src={contactAvatar}
                              alt={contactName}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                              {contactName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {contactName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            What goes around comes back...
                          </p>
                        </div>

                        {/* Call Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCallContact(contact.contact_id, 'voice')}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                            title="Voice Call"
                            disabled={isConnecting}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCallContact(contact.contact_id, 'video')}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            title="Video Call"
                            disabled={isConnecting}
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="text-sm">No contacts found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Call Actions & Debug */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Call Action Buttons */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex space-x-8 mb-8">
                <button
                  onClick={() => setShowNewCallModal(true)}
                  className="flex flex-col items-center space-y-2 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">New call link</span>
                </button>

                <button
                  onClick={() => setShowDialPad(true)}
                  className="flex flex-col items-center space-y-2 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <MoreHorizontal className="w-8 h-8 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Dial a number</span>
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                {socketConnected && <span className="text-xs">(Socket: Connected)</span>}
              </div>

              {/* Loading indicator */}
              {isConnecting && (
                <div className="flex items-center justify-center space-x-2 text-blue-500">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Connecting call...</span>
                </div>
              )}
            </div>
          </div>

          {/* Debug Logs */}
          <div className="h-48 border-t border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Logs</h3>
            <div className="text-xs text-gray-600 space-y-1">
              {logs.slice(-10).map((log, index) => (
                <div key={index} className="font-mono">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewCallModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Call Link</h3>
            <p className="text-gray-600 mb-4">Generate a link that others can use to join your call.</p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewCallModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {showDialPad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Dial a Number</h3>
            <input
              type="tel"
              placeholder="Enter phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDialPad(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Call;