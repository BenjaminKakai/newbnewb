// providers/IncomingCallModal.tsx
'use client';

import React from 'react';
import { useCallStore } from '@/store/callStore';
import { useCall } from './callProvider';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Mic,
  User
} from 'lucide-react';

const IncomingCallModal: React.FC = () => {
  const {
    showIncomingCallModal,
    callType,
    otherParticipantName,
    otherParticipantId,
  } = useCallStore();

  const { acceptCall, rejectCall } = useCall();

  // Don't render if modal shouldn't be shown
  if (!showIncomingCallModal) {
    return null;
  }

  // Get call type icon
  const getCallIcon = () => {
    return callType === 'video' ? <Video size={24} /> : <Phone size={24} />;
  };

  // Get call type text
  const getCallTypeText = () => {
    return callType === 'video' ? 'Video Call' : 'Voice Call';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white text-center">
            <div className="mb-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                {getCallIcon()}
              </div>
              <h3 className="text-lg font-semibold">Incoming {getCallTypeText()}</h3>
            </div>
          </div>

          {/* Caller Info */}
          <div className="p-6 text-center">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-white font-bold text-2xl">
                {otherParticipantName?.charAt(0)?.toUpperCase() || <User size={32} />}
              </div>
            </div>

            {/* Name */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {otherParticipantName || 'Unknown Caller'}
            </h2>

            {/* Call Type */}
            <p className="text-gray-600 mb-1">
              {getCallTypeText()}
            </p>

            {/* Caller ID (if different from name) */}
            {otherParticipantId && otherParticipantId !== otherParticipantName && (
              <p className="text-sm text-gray-500 truncate">
                {otherParticipantId}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-center space-x-8">
              {/* Reject Button */}
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                title="Decline call"
              >
                <PhoneOff size={24} className="text-white" />
              </button>

              {/* Accept Button */}
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                title="Accept call"
              >
                <Phone size={24} className="text-white" />
              </button>
            </div>

            {/* Action Labels */}
            <div className="flex justify-center space-x-8 mt-3">
              <span className="text-sm text-gray-600 w-16 text-center">Decline</span>
              <span className="text-sm text-gray-600 w-16 text-center">Accept</span>
            </div>
          </div>

          {/* Ringtone Animation */}
          <div className="absolute top-4 right-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce"></div>
              <div 
                className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce" 
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div 
                className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce" 
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCallModal;