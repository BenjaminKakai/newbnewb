import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "./authStore";

interface Contact {
  contact_id: string;
  name: string;
  avatar?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_name?: string;
}

interface ContactsState {
  contacts: Contact[];
  friendRequests: FriendRequest[];
  isLoadingContacts: boolean;
  isLoadingFriendRequests: boolean;
  error: string | null;
  setContacts: (contacts: Contact[]) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  fetchContacts: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  getContactName: (contactId: string, userId?: string) => string;
}

const CONTACTS_API_BASE_URL = "http://138.68.190.213:3019/api/v1";
const API_KEY = "QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==";

export const useContactsStore = create<ContactsState>()(
  devtools(
    (set, get) => ({
      contacts: [],
      friendRequests: [],
      isLoadingContacts: false,
      isLoadingFriendRequests: false,
      error: null,

      setContacts: (contacts) => set({ contacts }),
      setFriendRequests: (requests) => set({ friendRequests: requests }),

      fetchContacts: async () => {
        set({ isLoadingContacts: true, error: null });
        try {
          const { user, accessToken } = useAuthStore.getState();
          if (!user?.id || !accessToken) {
            throw new Error("No authentication data available");
          }
          const response = await fetch(
            `${CONTACTS_API_BASE_URL}/contacts/user/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": API_KEY,
              },
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || "Failed to fetch contacts"}`);
          }
          const data = await response.json();
          const contacts: Contact[] = data.contacts || [];
          set({ contacts, isLoadingContacts: false });
          console.log(`✅ Fetched ${contacts.length} contacts`);
        } catch (error) {
          console.error("❌ Failed to fetch contacts:", error);
          set({ isLoadingContacts: false, error: `Failed to fetch contacts: ${error}` });
        }
      },
      

      fetchFriendRequests: async () => {
        set({ isLoadingFriendRequests: true, error: null });
        try {
          const { user, accessToken } = useAuthStore.getState();
          if (!user?.id || !accessToken) {
            throw new Error("No authentication data available");
          }
          const response = await fetch(
            `${CONTACTS_API_BASE_URL}/friend-requests/by-receiver-id/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": API_KEY,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const friendRequests = Array.isArray(data.results)
            ? data.results.map((req: any) => ({
                id: req.id,
                sender_id: req.sender_id,
                receiver_id: req.receiver_id,
                status: req.status,
                created_at: req.createdAt,
                sender_name: req.user_detail
                  ? `${req.user_detail.first_name} ${req.user_detail.last_name}`.trim()
                  : req.sender_id,
              }))
            : [];
          set({ friendRequests, isLoadingFriendRequests: false });
          console.log(`✅ Fetched ${friendRequests.length} friend requests`);
        } catch (error) {
          console.error("❌ Failed to fetch friend requests:", error);
          set({
            isLoadingFriendRequests: false,
            error: `Failed to fetch friend requests: ${error}`,
          });
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        try {
          const { accessToken } = useAuthStore.getState();
          if (!accessToken) {
            throw new Error("No authentication data available");
          }
          const response = await fetch(
            `${CONTACTS_API_BASE_URL}/friend-requests/${requestId}/accept`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": API_KEY,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          set((state) => ({
            friendRequests: state.friendRequests.filter(
              (req) => req.id !== requestId
            ),
          }));
          await get().fetchContacts(); // Refresh contacts after accepting
          console.log(`✅ Accepted friend request ${requestId}`);
        } catch (error) {
          console.error("❌ Failed to accept friend request:", error);
          set({ error: `Failed to accept friend request: ${error}` });
        }
      },

      rejectFriendRequest: async (requestId: string) => {
        try {
          const { accessToken } = useAuthStore.getState();
          if (!accessToken) {
            throw new Error("No authentication data available");
          }
          const response = await fetch(
            `${CONTACTS_API_BASE_URL}/friend-requests/${requestId}/reject`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-api-key": API_KEY,
              },
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          set((state) => ({
            friendRequests: state.friendRequests.filter(
              (req) => req.id !== requestId
            ),
          }));
          console.log(`✅ Rejected friend request ${requestId}`);
        } catch (error) {
          console.error("❌ Failed to reject friend request:", error);
          set({ error: `Failed to reject friend request: ${error}` });
        }
      },

      getContactName: (contactId: string, userId?: string) => {
        const contact = get().contacts.find((c) => c.contact_id === contactId);
        if (contact) {
          return contact.name;
        }
        return contactId === userId ? "You" : contactId;
      },
    }),
    { name: "ContactsStore" }
  )
);