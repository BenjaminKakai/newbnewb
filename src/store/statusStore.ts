import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { useContactsStore } from "./contactsStore";

export interface StatusUser {
  id: string;
  name: string;
  avatar?: string;
  statuses: StatusItem[];
}

export interface StatusItem {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  views: number;
  isViewed: boolean;
}

export interface StatusData {
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  image?: File;
}

interface StatusState {
  statusUsers: StatusUser[];
  isLoadingStatuses: boolean;
  error: string | null;
  setStatusUsers: (statusUsers: StatusUser[]) => void;
  setIsLoadingStatuses: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchStatuses: () => Promise<void>;
  uploadStatus: (statusData: StatusData) => Promise<void>;
}

const STATUS_API_BASE_URL = process.env.NEXT_PUBLIC_STATUS_API_BASE_URL;

export const useStatusStore = create<StatusState>()(
  devtools(
    (set, get) => ({
      statusUsers: [],
      isLoadingStatuses: false,
      error: null,
      setStatusUsers: (statusUsers) => set({ statusUsers }),
      setIsLoadingStatuses: (isLoading) =>
        set({ isLoadingStatuses: isLoading }),
      setError: (error) => set({ error }),
      fetchStatuses: async () => {
        set({ isLoadingStatuses: true, error: null });
        try {
          const { accessToken, user } = useAuthStore.getState();
          const { getContactName, contacts } = useContactsStore.getState();

          if (!accessToken || !user?.id) {
            throw new Error("No authentication data available");
          }

          const response = await fetch(`${STATUS_API_BASE_URL}/status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) throw new Error("Failed to fetch statuses");

          const data = await response.json();
          const rawStatuses = data.data || [];

          const statusUsersMap: { [key: string]: StatusUser } = {};
          rawStatuses.forEach((status: any) => {
            const userId = status.userId;
            const statusItem: StatusItem = {
              id: status.id,
              type: status.media.length > 0 ? status.media[0].type : "text",
              content: status.content,
              backgroundColor: "#3B82F6",
              textColor: "#FFFFFF",
              font: "font-sans",
              imageUrl:
                status.media.length > 0 && status.media[0].type === "image"
                  ? status.media[0].url
                  : undefined,
              videoUrl:
                status.media.length > 0 && status.media[0].type === "video"
                  ? status.media[0].url
                  : undefined,
              timestamp: status.createdAt,
              views: status.views,
              isViewed: false,
            };

            if (!statusUsersMap[userId]) {
              statusUsersMap[userId] = {
                id: userId,
                name: getContactName(userId, user.id),
                avatar: contacts.find((c) => c.contact_id === userId)?.avatar,
                statuses: [],
              };
            }
            statusUsersMap[userId].statuses.push(statusItem);
          });

          const mappedStatuses: StatusUser[] = Object.values(statusUsersMap);

          if (mappedStatuses.length === 0) {
            mappedStatuses.push(
              {
                id: "dummy1",
                name: getContactName("Liam Anderson", user?.id) || "John Doe",
                avatar: contacts[0]?.avatar,
                statuses: [
                  {
                    id: "dummy1-status1",
                    type: "image",
                    content: "",

                    imageUrl:
                      "https://plus.unsplash.com/premium_photo-1706026591626-c54429307230?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    textColor: "#FFFFFF",
                    font: "font-sans",
                    timestamp: new Date().toISOString(),
                    views: 0,
                    isViewed: false,
                  },
                ],
              },
              {
                id: "dummy2",
                name: getContactName("Liam Anderson", user?.id) || "Jane Smith",
                avatar: contacts[1]?.avatar,
                statuses: [
                  {
                    id: "dummy2-status1",
                    type: "image",
                    content: "",
                    imageUrl:
                      "https://images.unsplash.com/photo-1682687982423-295485af248a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    timestamp: new Date().toISOString(),
                    views: 0,
                    isViewed: false,
                  },
                ],
              }
            );
          }

          set({ statusUsers: mappedStatuses, isLoadingStatuses: false });
        } catch (error) {
          console.error("Failed to fetch statuses:", error);
          const { getContactName, contacts } = useContactsStore.getState();
          const { user } = useAuthStore.getState();
          set({
            isLoadingStatuses: false,
            error: `Failed to fetch statuses: ${error}`,
            statusUsers: [
              {
                id: "dummy1",
                name: getContactName("Liam Anderson", user?.id) || "John Doe",
                avatar: contacts[0]?.avatar,
                statuses: [
                  {
                    id: "dummy1-status1",
                    type: "image",
                    content: "",

                    imageUrl:
                      "https://plus.unsplash.com/premium_photo-1706026591626-c54429307230?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    textColor: "#FFFFFF",
                    font: "font-sans",
                    timestamp: new Date().toISOString(),
                    views: 0,
                    isViewed: false,
                  },
                ],
              },
              {
                id: "dummy2",
                name: getContactName("Liam Anderson", user?.id) || "Jane Smith",
                avatar: contacts[1]?.avatar,
                statuses: [
                  {
                    id: "dummy2-status1",
                    type: "image",
                    content: "",
                    imageUrl:
                      "https://images.unsplash.com/photo-1682687982423-295485af248a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    timestamp: new Date().toISOString(),
                    views: 0,
                    isViewed: false,
                  },
                ],
              }
            ],
          });
        }
      },
      uploadStatus: async (statusData: StatusData) => {
        try {
          const { accessToken } = useAuthStore.getState();
          if (!accessToken) {
            throw new Error("No authentication data available");
          }

          const formData = new FormData();
          formData.append("type", statusData.type);
          if (statusData.type === "text") {
            formData.append("content", statusData.content);
            formData.append(
              "backgroundColor",
              statusData.backgroundColor || "#3B82F6"
            );
            formData.append("textColor", statusData.textColor || "#FFFFFF");
            formData.append("font", statusData.font || "font-sans");
          } else if (statusData.image) {
            formData.append("media", statusData.image);
          }

          const response = await fetch(`${STATUS_API_BASE_URL}/status`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });

          if (!response.ok) throw new Error("Failed to upload status");

          await get().fetchStatuses(); // Refresh statuses after upload
        } catch (error) {
          console.error("Failed to upload status:", error);
          set({ error: `Failed to upload status: ${error}` });
        }
      },
    }),
    { name: "StatusStore" }
  )
);
