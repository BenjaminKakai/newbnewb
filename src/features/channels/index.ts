// features/channels/types/index.ts
export interface Channel {
    id: string
    _id?: string
    name: string
    handle: string
    description: string
    category: string
    followerCount: number
    postCount: number
    verified: boolean
    isOwner: boolean
    ownerId: string
    createdAt: string
    lastActivity?: string
    unreadCount?: number
    lastMessage?: string
    isOnline?: boolean
    stats?: {
      followerCount: number
      postCount: number
      viewCount: number
    }
    settings?: {
      isPublic: boolean
      allowComments: boolean
      allowTips: boolean
    }
    isFollowing?: boolean
  }
  
  export interface ChatMessage {
    id: string
    userId: string
    userName: string
    message: string
    timestamp: string
    type: 'user' | 'system'
    channelId?: string
  }
  
  export interface CreateChannelForm {
    name: string
    handle: string
    description: string
    category: string
  }
  
  export interface Post {
    id: string
    channelId: string
    title: string
    content: string
    type: 'text' | 'image' | 'video' | 'link' | 'poll'
    visibility: 'public' | 'followers' | 'subscribers' | 'private'
    authorId: string
    authorName: string
    createdAt: string
    likes: number
    comments: number
    shares: number
    views: number
    userLiked?: boolean
  }
  
  export interface ChannelAnalytics {
    totalViews: number
    totalFollowers: number
    totalEngagement: number
    totalRevenue: number
    growth?: {
      followers: number
      engagement: number
      views: number
    }
  }
  
  export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: string
  }
  
  // features/channels/services/api.ts
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://calls-dev.wasaachat.com'
  
  class ChannelsApiService {
    private getAuthHeaders() {
      const token = localStorage.getItem('accessToken')
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
      }
    }
  
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
      try {
        const url = `${API_BASE_URL}${endpoint}`
        
        const response = await fetch(url, {
          headers: this.getAuthHeaders(),
          ...options,
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
  
        const data = await response.json()
        return data
      } catch (error) {
        console.error(`API Error: ${endpoint}`, error)
        throw error
      }
    }
  
    // Channel Management
    async getChannels(): Promise<ApiResponse<Channel[]>> {
      return this.request<Channel[]>('/api/v1/channels')
    }
  
    async createChannel(data: CreateChannelForm): Promise<ApiResponse<Channel>> {
      return this.request<Channel>('/api/v1/channels', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }
  
    async updateChannel(id: string, data: Partial<Channel>): Promise<ApiResponse<Channel>> {
      return this.request<Channel>(`/api/v1/channels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    }
  
    async deleteChannel(id: string): Promise<ApiResponse> {
      return this.request(`/api/v1/channels/${id}`, {
        method: 'DELETE',
      })
    }
  
    async followChannel(id: string): Promise<ApiResponse> {
      return this.request(`/api/v1/channels/${id}/follow`, {
        method: 'POST',
      })
    }
  
    async unfollowChannel(id: string): Promise<ApiResponse> {
      return this.request(`/api/v1/channels/${id}/unfollow`, {
        method: 'POST',
      })
    }
  
    // Channel Messages
    async getChannelMessages(channelId: string): Promise<ApiResponse<ChatMessage[]>> {
      return this.request<ChatMessage[]>(`/api/v1/channels/${channelId}/messages`)
    }
  
    async sendMessage(channelId: string, content: string): Promise<ApiResponse<ChatMessage>> {
      return this.request<ChatMessage>(`/api/v1/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, type: 'text' }),
      })
    }
  
    // Channel Analytics
    async getChannelAnalytics(channelId: string): Promise<ApiResponse<ChannelAnalytics>> {
      return this.request<ChannelAnalytics>(`/api/v1/channels/${channelId}/stats`)
    }
  
    // Posts
    async getChannelPosts(channelId: string): Promise<ApiResponse<Post[]>> {
      return this.request<Post[]>(`/api/v1/channels/${channelId}/posts`)
    }
  
    async createPost(channelId: string, data: Partial<Post>): Promise<ApiResponse<Post>> {
      return this.request<Post>(`/api/v1/channels/${channelId}/posts`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }
  
    async likePost(postId: string): Promise<ApiResponse> {
      return this.request(`/api/v1/posts/${postId}/like`, {
        method: 'POST',
      })
    }
  
    async unlikePost(postId: string): Promise<ApiResponse> {
      return this.request(`/api/v1/posts/${postId}/unlike`, {
        method: 'POST',
      })
    }
  }
  
  export const channelsApi = new ChannelsApiService()
  

  

  
  // features/channels/components/index.ts
  export { ChannelsPage } from './ChannelsPage'
  export { ChannelsList } from './ChannelsList'
  export { ChatArea } from './ChatArea'
  export { CreateChannelModal } from './CreateChannelModal'
  export { SidebarNav } from './SidebarNav'
  
  // Enhanced Store with better error handling
  // stores/channelsStore.ts (additional utility methods)
  
  // Add these methods to your existing channelsStore:
  
  export const useChannelsStoreActions = () => {
    const store = useChannelsStore()
    
    return {
      // Utility actions
      toggleChannelFollow: async (channelId: string) => {
        const channel = store.channels.find(c => c.id === channelId || c._id === channelId)
        if (!channel) return
        
        if (channel.isFollowing) {
          await store.followChannel(channelId) // This will unfollow
        } else {
          await store.followChannel(channelId) // This will follow
        }
      },
      
      searchChannels: (query: string) => {
        store.setSearchQuery(query)
        return store.channels.filter(channel =>
          channel.name.toLowerCase().includes(query.toLowerCase()) ||
          channel.handle.toLowerCase().includes(query.toLowerCase()) ||
          channel.description.toLowerCase().includes(query.toLowerCase())
        )
      },
      
      getChannelsByCategory: (category: string) => {
        return store.channels.filter(channel => channel.category === category)
      },
      
      getOwnedChannels: () => {
        return store.channels.filter(channel => channel.isOwner)
      },
      
      getFollowedChannels: () => {
        return store.channels.filter(channel => !channel.isOwner && channel.isFollowing)
      },
      
      getTotalFollowers: () => {
        return store.channels.reduce((total, channel) => total + channel.followerCount, 0)
      },
      
      getUnreadCount: () => {
        return store.channels.reduce((total, channel) => total + (channel.unreadCount || 0), 0)
      },
    }
  }