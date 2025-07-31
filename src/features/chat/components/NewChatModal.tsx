import React, { useState, useEffect } from 'react';
import { useContactsStore } from '@/store/contactsStore';
import { useAuthStore } from '@/store/authStore';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { contacts, isLoadingContacts, fetchContacts } = useContactsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, fetchContacts]);

  const filteredContacts = contacts.filter(
    contact =>
      contact.contact_id !== user?.id &&
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Contact to Chat</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {connected ? (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search contacts"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {isLoadingContacts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <p className="text-center text-gray-500">No contacts found</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.contact_id}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        const jid = `${contact.contact_id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`;
                        onStartChat(jid);
                        onClose();
                      }}
                    >
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-gray-600">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="text-gray-900">{contact.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Please connect to the chat server to start a new chat.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;