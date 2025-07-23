// providers/OutgoingCallModal.tsx
'use client';

import React from 'react';
import { useCallStore } from '@/store/callStore';
import { useCall } from './callProvider';
import { 
  PhoneOff, 
  Video, 
  Phone,
  User
} from 'lucide-react';

const OutgoingCallModal: React.FC = () => {
  const {
    showOutgoingCallModal,
    callType,
    otherParticipantName,
    otherParticipantId,
  } = useCallStore();

  const { cancelCall } = useCall();

  // Don't render if modal shouldn't be shown
  if (!showOutgoingCallModal) {
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
              <h3 className="text-lg font-semibold">{getCallTypeText()}</h3>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 text-center">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-white font-bold text-2xl">
                {otherParticipantName?.charAt(0)?.toUpperCase() || <User size={32} />}
              </div>
            </div>

            {/* Name */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {otherParticipantName || 'Contact'}
            </h2>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-gray-600">Calling...</p>
            </div>

            {/* Contact ID (if different from name) */}
            {otherParticipantId && otherParticipantId !== otherParticipantName && (
              <p className="text-sm text-gray-500 truncate">
                {otherParticipantId}
              </p>
            )}
          </div>

          {/* Calling Animation */}
          <div className="px-6 pb-4">
            <div className="flex justify-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div 
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div 
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-center">
              {/* Cancel Button */}
              <button
                onClick={cancelCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                title="Cancel call"
              >
                <PhoneOff size={24} className="text-white" />
              </button>
            </div>

            {/* Action Label */}
            <div className="flex justify-center mt-3">
              <span className="text-sm text-gray-600">Cancel</span>
            </div>
          </div>

          {/* Pulse Animation Ring */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 rounded-full border-4 border-white border-opacity-30 animate-ping"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OutgoingCallModal;