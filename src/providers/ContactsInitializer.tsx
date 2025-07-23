// providers/ContactsInitializer.tsx
'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useContactsStore } from '@/store/contactsStore';

interface ContactsInitializerProps {
  children: React.ReactNode;
}

export const ContactsInitializer: React.FC<ContactsInitializerProps> = ({ children }) => {
  const { user, accessToken } = useChatStore();
  const { fetchContacts, hasAttemptedFetch, isLoading } = useContactsStore();

  // Auto-fetch contacts when user logs in
  useEffect(() => {
    if (user?.id && accessToken && !hasAttemptedFetch && !isLoading) {
      console.log('🚀 Auto-fetching contacts for user:', user.id);
      fetchContacts(user.id, accessToken);
    }
  }, [user?.id, accessToken, hasAttemptedFetch, isLoading, fetchContacts]);

  return <>{children}</>;
};

export default ContactsInitializer;