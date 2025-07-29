// /home/benjamin/wasaa-web-service/src/components/ManualCallComponent.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { useCallStore } from '@/store/callStore';

interface Contact {
  id: string;
  userId: string;
  phone: string;
  name: string;
  token?: string;
}

interface CallData {
  from: string;
  to: string;
  contact: Contact;
  token: string;
}

interface ManualCallComponentProps {
  onInitiateCall: (callData: CallData) => Promise<void>;
  currentUserId: string | null;
  accessToken: string | null;
}

const ManualCallComponent: React.FC<ManualCallComponentProps> = ({
  onInitiateCall,
  currentUserId,
  accessToken,
}) => {
  const [targetUserId, setTargetUserId] = useState('');
  const [contactName, setContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCallResult, setLastCallResult] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { user, accessToken: storeToken } = useAuthStore();
  const { socket, isConnected } = useSocket({
    token: storeToken,
    userId: currentUserId,
    onMessage: (msg: unknown) => console.log(msg)
  });
  const { setCurrentCall, setIsInCall, setIsConnecting, setConnectionError } = useCallStore();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isHydrated) return;

    socket.on('call-initiated', (data: { status: string; callId: string }) => {
      console.log(`✅ Call initiated: ${JSON.stringify(data)}`);
      setLastCallResult(`✅ Call initiated to ${targetUserId} (Call ID: ${data.callId})`);
      setCurrentCall({
        id: data.callId,
        type: 'outgoing',
        callType: 'video', // Adjust based on your UI
        participants: [{ id: targetUserId, name: contactName || 'Unknown', status: 'connecting', isMuted: false, isVideoEnabled: true }],
        startTime: new Date(),
        status: 'connecting',
        isGroupCall: false,
      });
      setIsInCall(true);
      setIsConnecting(false);
    });

    socket.on('error', (data: { message: string }) => {
      console.error(`🚨 Server error: ${data.message}`);
      setLastCallResult(`❌ Call failed: ${data.message}`);
      setIsConnecting(false);
      setConnectionError(data.message);
    });

    return () => {
      socket.off('call-initiated');
      socket.off('error');
    };
  }, [socket, targetUserId, contactName, setCurrentCall, setIsInCall, setIsConnecting, setConnectionError, isHydrated]);

  if (!isHydrated) {
    return <div>Loading authentication...</div>;
  }

  const handleStartCall = async () => {
    if (!targetUserId.trim()) {
      setLastCallResult('❌ Please enter a user ID');
      return;
    }
    if (!user?.id || !currentUserId) {
      setLastCallResult('❌ You are not authenticated');
      return;
    }
    if (!storeToken || !accessToken) {
      setLastCallResult('❌ No access token available');
      return;
    }
    if (!isConnected) {
      setLastCallResult('❌ Socket not connected');
      return;
    }

    console.log('🔍 Full store state:', useAuthStore.getState());
    console.log('🔥 Using token:', storeToken);
    console.log('🔥 Current user:', user?.id);
    console.log('🔍 Target user:', targetUserId);

    setIsLoading(true);
    setIsConnecting(true);
    setLastCallResult('🔄 Initiating call...');

    try {
      const mockContact: Contact = {
        id: `contact_${targetUserId}`,
        userId: targetUserId,
        phone: '+1234567890',
        name: contactName || `User ${targetUserId}`,
        token: storeToken,
      };

      const callData: CallData = {
        from: user.id,
        to: targetUserId,
        contact: mockContact,
        token: storeToken,
      };

      console.log('🚀 Manual Call Initiated:', callData);
      await onInitiateCall(callData);

      // Emit call-offer via socket
      const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit('call-offer', {
        callId: `temp-${Date.now()}`, // Will be updated by call-initiated
        targetId: targetUserId,
        offer,
        callerId: user.id,
        callType: 'video', // Adjust based on your UI
      });

    } catch (error) {
      console.error('❌ Manual call failed:', error);
      setLastCallResult(`❌ Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setTargetUserId('');
    setContactName('');
    setLastCallResult(null);
  };

  const testUserIds = [
    '5717c314-0ed1-4984-aa0d-4af6c961586e', // Dev 1
    '9a105e6f-ca83-4e09-ab83-46dfdfef112e', // Dev 2
  ];

  const isCallDisabled = !targetUserId.trim() || !currentUserId || !accessToken || isLoading || !isConnected;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📞 Manual Call</h2>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">
          <div>Your ID: <span className="font-mono">{currentUserId || 'Not set'}</span></div>
          <div>Token: <span className="font-mono">{accessToken ? '✅ Available' : '❌ Missing'}</span></div>
          <div>Socket: <span className="font-mono">{isConnected ? '✅ Connected' : '❌ Disconnected'}</span></div>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID *</label>
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Enter user ID to call"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name (Optional)</label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Display name for this contact"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Test IDs:</label>
          <div className="flex flex-wrap gap-2">
            {testUserIds.map((userId) => (
              <button
                key={userId}
                onClick={() => setTargetUserId(userId)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                disabled={isLoading}
              >
                {userId}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStartCall}
            disabled={isCallDisabled}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              isCallDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLoading ? '🔄 Calling...' : '📞 Start Call'}
          </button>
          <button
            onClick={handleClearForm}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
        {lastCallResult && (
          <div
            className={`p-3 rounded-md text-sm ${
              lastCallResult.includes('✅') ? 'bg-green-50 text-green-800' : lastCallResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
            }`}
          >
            {lastCallResult}
          </div>
        )}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <strong>💡 How to use:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Enter the user ID you want to call</li>
            <li>• Optional: Add a display name</li>
            <li>• Click &quot;Start Call&quot; to initiate</li>
            <li>• Use quick test IDs for testing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManualCallComponent;