import React, { useState } from 'react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (jid: string) => void;
  connected: boolean;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
  connected
}) => {
  const [jid, setJid] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jid.trim()) {
      setError('Please enter a valid JID');
      return;
    }

    // Basic JID validation
    if (!jid.includes('@')) {
      setError('JID must include domain (e.g., user@domain.com)');
      return;
    }

    setError('');
    onStartChat(jid.trim());
    setJid('');
    onClose();
  };

  const handleClose = () => {
    setJid('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Start New Chat</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="jid" className="block text-sm font-medium text-gray-700 mb-2">
              Enter JID (Username@Domain)
            </label>
            <input
              type="text"
              id="jid"
              value={jid}
              onChange={(e) => {
                setJid(e.target.value);
                setError('');
              }}
              placeholder="e.g., user@xmpp-dev.wasaachat.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!connected}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400">ℹ️</span>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-blue-700">
                    Enter the full JID of the person you want to chat with. 
                    They must be registered on the same XMPP server.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!connected && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">⚠️</span>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-red-700">
                      You are not connected to the chat server. Please connect first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!connected || !jid.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;