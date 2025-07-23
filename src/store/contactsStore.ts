// store/contactsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import ContactService, { Contact } from '@/services/contactService';

export interface ContactsState {
  // State
  contacts: Contact[];
  contactsMap: Record<string, Contact>;
  isLoading: boolean;
  error: string | null;
  hasAttemptedFetch: boolean;

  // Actions
  setContacts: (contacts: Contact[]) => void;
  setContactsMap: (contactsMap: Record<string, Contact>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasAttemptedFetch: (attempted: boolean) => void;
  
  // Async actions
  fetchContacts: (userId: string, accessToken: string) => Promise<void>;
  
  // Utility methods
  findContactByUserId: (userId: string) => Contact | null;
  findContactByPhone: (phoneNumber: string) => Contact | null;
  getContactName: (userId: string, fallback?: string) => string;
  clearContacts: () => void;
}

export const useContactsStore = create<ContactsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      contacts: [],
      contactsMap: {},
      isLoading: false,
      error: null,
      hasAttemptedFetch: false,

      // Basic setters
      setContacts: (contacts) => {
        set({ contacts });
        
        // Auto-generate contacts map when contacts are set
        const contactsMap: Record<string, Contact> = {};
        
        contacts.forEach((contact) => {
          // Map by all possible ID fields
          if (contact.contact_id) contactsMap[contact.contact_id] = contact;
          if (contact.user_id) contactsMap[contact.user_id] = contact;
          if (contact.id) contactsMap[contact.id] = contact;
          
          // Map by phone number variants
          if (contact.phone_number || contact.number) {
            const phoneNumber = contact.phone_number || contact.number;
            const variants = [
              phoneNumber,
              phoneNumber!.replace(/^\+/, ""),
              phoneNumber!.startsWith("254")
                ? `0${phoneNumber!.substring(3)}`
                : null,
            ].filter(Boolean);

            variants.forEach((variant) => {
              if (variant) {
                contactsMap[variant] = contact;
              }
            });
          }

          // Map nested contact properties
          if (contact.contact) {
            if (contact.contact.id) {
              contactsMap[contact.contact.id] = contact;
            }
            if (contact.contact.phone_number) {
              const variants = [
                contact.contact.phone_number,
                contact.contact.phone_number.replace(/^\+/, ""),
                contact.contact.phone_number.startsWith("254")
                  ? `0${contact.contact.phone_number.substring(3)}`
                  : null,
              ].filter(Boolean);

              variants.forEach((variant) => {
                if (variant) {
                  contactsMap[variant] = contact;
                }
              });
            }
          }
        });
        
        set({ contactsMap });
      },

      setContactsMap: (contactsMap) => set({ contactsMap }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setHasAttemptedFetch: (hasAttemptedFetch) => set({ hasAttemptedFetch }),

      // Async action to fetch contacts
      fetchContacts: async (userId: string, accessToken: string) => {
        const { hasAttemptedFetch, isLoading } = get();
        
        if (hasAttemptedFetch || isLoading) {
          console.log('📇 Contacts already fetched or currently fetching');
          return;
        }

        set({ isLoading: true, error: null, hasAttemptedFetch: true });

        try {
          console.log('📇 Fetching contacts for user:', userId);
          const contactsList = await ContactService.fetchContacts(userId, accessToken);
          console.log('📇 Received contacts:', contactsList.length);

          if (!Array.isArray(contactsList)) {
            throw new Error('Invalid contacts data format');
          }

          // Use setContacts which will auto-generate the map
          get().setContacts(contactsList);
          
          console.log('📇 Contacts successfully stored in Zustand');
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch contacts',
            contacts: [],
            contactsMap: {}
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Utility methods
      findContactByUserId: (userId: string) => {
        const { contactsMap } = get();
        return contactsMap[userId] || null;
      },

      findContactByPhone: (phoneNumber: string) => {
        const { contactsMap } = get();
        
        // Try exact match first
        if (contactsMap[phoneNumber]) {
          return contactsMap[phoneNumber];
        }
        
        // Try phone number variants
        const variants = [
          phoneNumber.replace(/^\+/, ""),
          phoneNumber.startsWith("254") ? `0${phoneNumber.substring(3)}` : null,
          phoneNumber.startsWith("0") ? `254${phoneNumber.substring(1)}` : null,
          phoneNumber.startsWith("0") ? `+254${phoneNumber.substring(1)}` : null,
        ].filter(Boolean);

        for (const variant of variants) {
          if (variant && contactsMap[variant]) {
            return contactsMap[variant];
          }
        }
        
        return null;
      },

      getContactName: (userId: string, fallback?: string) => {
        const contact = get().findContactByUserId(userId);
        
        if (contact) {
          return contact.name || 
                 contact.phone_number || 
                 contact.number || 
                 fallback || 
                 'Unknown Contact';
        }
        
        return fallback || 
               (userId.length > 15 ? `Contact ${userId.substring(0, 8)}...` : userId);
      },

      clearContacts: () => {
        set({
          contacts: [],
          contactsMap: {},
          isLoading: false,
          error: null,
          hasAttemptedFetch: false,
        });
      },
    }),
    {
      name: 'contacts-store',
    }
  )
);