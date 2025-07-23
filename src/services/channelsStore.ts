// stores/channelsStore.ts
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'

// Types
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

// API Response Types
export interface ApiChannelResponse {
  _id?: string
  id?: string
  name: string
  handle: string
  description: string
  category: string
  ownerId: string
  createdAt: string
  verified?: boolean
  stats?: {
    followerCount?: number
    postCount?: number
    viewCount?: number
  }
  settings?: {
    isPublic?: boolean
    allowComments?: boolean
    allowTips?: boolean
  }
  isFollowing?: boolean
}

export interface ApiMessageResponse {
  _id?: string
  id?: string
  userId: string
  userName?: string
  author?: {
    name?: string
    id?: string
  }
  content?: string
  message?: string
  createdAt?: string
  timestamp?: string
  type?: string
}

export interface ChannelsState {
  // Data
  channels: Channel[]
  selectedChannel: Channel | null
  messages: ChatMessage[]
  posts: Post[]
  
  // UI State
  searchQuery: string
  activeFilter: 'all' | 'unread' | 'owned' | 'followed'
  currentTab: 'channels' | 'posts' | 'analytics' | 'chat' | 'admin'
  showCreateModal: boolean
  isLoading: boolean
  
  // Socket & Connection
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  currentChatRoom: string | null
  
  // Form State
  createForm: CreateChannelForm
  newMessage: string
  
  // Analytics
  analytics: {
    totalViews: number
    totalFollowers: number
    totalEngagement: number
    totalRevenue: number
  }
}

export interface ChannelsActions {
  // Channel Management
  setChannels: (channels: Channel[]) => void
  addChannel: (channel: Channel) => void
  updateChannel: (id: string, updates: Partial<Channel>) => void
  removeChannel: (id: string) => void
  selectChannel: (channel: Channel | null) => void
  
  // Search & Filtering
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: ChannelsState['activeFilter']) => void
  
  // UI State
  setCurrentTab: (tab: ChannelsState['currentTab']) => void
  setShowCreateModal: (show: boolean) => void
  setIsLoading: (loading: boolean) => void
  
  // Socket Management
  initializeSocket: (token: string, userId: string) => void
  disconnectSocket: () => void
  setConnected: (connected: boolean) => void
  setConnecting: (connecting: boolean) => void
  
  // Chat Management
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setCurrentChatRoom: (roomId: string | null) => void
  setNewMessage: (message: string) => void
  
  // Posts Management
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  
  // Form Management
  setCreateForm: (form: Partial<CreateChannelForm>) => void
  resetCreateForm: () => void
  
  // Analytics
  setAnalytics: (analytics: Partial<ChannelsState['analytics']>) => void
  
  // API Actions
  loadChannels: () => Promise<void>
  createChannel: (data: CreateChannelForm) => Promise<void>
  loadChannelMessages: (channelId: string) => Promise<void>
  sendMessage: () => Promise<void>
  followChannel: (channelId: string) => Promise<void>
  
  // Utility
  reset: () => void
}

type ChannelsStore = ChannelsState & ChannelsActions

const initialState: ChannelsState = {
  channels: [],
  selectedChannel: null,
  messages: [],
  posts: [],
  searchQuery: '',
  activeFilter: 'all',
  currentTab: 'channels',
  showCreateModal: false,
  isLoading: false,
  socket: null,
  isConnected: false,
  isConnecting: false,
  currentChatRoom: null,
  createForm: {
    name: '',
    handle: '',
    description: '',
    category: 'Tech'
  },
  newMessage: '',
  analytics: {
    totalViews: 0,
    totalFollowers: 0,
    totalEngagement: 0,
    totalRevenue: 0
  }
}

// Configuration
const SOCKET_URL = "https://dev-api-gateway.wasaachat.com:9638"
const API_BASE_URL = "https://dev-api-gateway.wasaachat.com:9638"

export const useChannelsStore = create<ChannelsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // Channel Management
      setChannels: (channels) => set({ channels }),
      
      addChannel: (channel) => set((state) => ({
        channels: [channel, ...state.channels]
      })),
      
      updateChannel: (id, updates) => set((state) => ({
        channels: state.channels.map(channel =>
          (channel.id === id || channel._id === id) ? { ...channel, ...updates } : channel
        )
      })),
      
      removeChannel: (id) => set((state) => ({
        channels: state.channels.filter(channel => 
          channel.id !== id && channel._id !== id
        )
      })),
      
      selectChannel: (channel) => set({ selectedChannel: channel }),

      // Search & Filtering
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveFilter: (activeFilter) => set({ activeFilter }),

      // UI State
      setCurrentTab: (currentTab) => set({ currentTab }),
      setShowCreateModal: (showCreateModal) => set({ showCreateModal }),
      setIsLoading: (isLoading) => set({ isLoading }),

      // Socket Management
      initializeSocket: (token: string, userId: string) => {
        const state = get()
        
        if (state.socket?.connected) {
          console.log('Socket already connected')
          return
        }

        console.log('Initializing socket connection...')
        set({ isConnecting: true })

        try {
          const socket = io(SOCKET_URL, {
            auth: { token, userId },
            transports: ['polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            forceNew: true,
            upgrade: false,
          })

          // Connection events
          socket.on('connect', () => {
            console.log('✅ Socket connected successfully')
            set({ isConnected: true, isConnecting: false })
            
            // Join user's personal room
            socket.emit('join-room', {
              roomId: `user-${userId}`,
              userId,
              userName: 'User' // You might want to get this from auth store
            })
          })

          socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason)
            set({ isConnected: false, isConnecting: false })
          })

          socket.on('connect_error', (error) => {
            console.error('🔥 Socket connection error:', error)
            set({ isConnected: false, isConnecting: false })
          })

          // Channel events
          socket.on('channel-created', (data) => {
            console.log('📢 Channel created:', data)
            get().loadChannels()
          })

          socket.on('channel-updated', (data) => {
            console.log('📝 Channel updated:', data)
            get().loadChannels()
          })

          // Chat events
          socket.on('chat-message', (data) => {
            console.log('💬 New chat message:', data)
            const { selectedChannel } = get()
            if (selectedChannel && data.channelId === selectedChannel.id) {
              get().addMessage({
                id: data.id || Date.now().toString(),
                userId: data.userId,
                userName: data.userName,
                message: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                type: 'user',
              })
            }
          })

          socket.on('user-joined-channel', (data) => {
            console.log('👋 User joined channel:', data)
            const { selectedChannel } = get()
            if (selectedChannel && data.channelId === selectedChannel.id) {
              get().addMessage({
                id: Date.now().toString(),
                userId: 'system',
                userName: 'System',
                message: `${data.userName} joined the channel`,
                timestamp: new Date().toISOString(),
                type: 'system',
              })
            }
          })

          set({ socket })
        } catch (error) {
          console.error('Failed to initialize socket:', error)
          set({ isConnected: false, isConnecting: false })
        }
      },

      disconnectSocket: () => {
        const { socket } = get()
        if (socket) {
          console.log('🔌 Disconnecting socket...')
          socket.disconnect()
          set({ socket: null, isConnected: false })
        }
      },

      setConnected: (isConnected) => set({ isConnected }),
      setConnecting: (isConnecting) => set({ isConnecting }),

      // Chat Management
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      setCurrentChatRoom: (currentChatRoom) => set({ currentChatRoom }),
      setNewMessage: (newMessage) => set({ newMessage }),

      // Posts Management
      setPosts: (posts) => set({ posts }),
      
      addPost: (post) => set((state) => ({
        posts: [post, ...state.posts]
      })),
      
      updatePost: (id, updates) => set((state) => ({
        posts: state.posts.map(post =>
          post.id === id ? { ...post, ...updates } : post
        )
      })),

      // Form Management
      setCreateForm: (updates) => set((state) => ({
        createForm: { ...state.createForm, ...updates }
      })),
      
      resetCreateForm: () => set({
        createForm: {
          name: '',
          handle: '',
          description: '',
          category: 'Tech'
        }
      }),

      // Analytics
      setAnalytics: (updates) => set((state) => ({
        analytics: { ...state.analytics, ...updates }
      })),

      // API Actions
      loadChannels: async () => {
        set({ isLoading: true })
        
        try {
          // You'll need to implement the API request helper
          const response = await fetch(`${API_BASE_URL}/api/v1/channels`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              const apiChannels = data.data.map((channel: ApiChannelResponse) => ({
                ...channel,
                id: channel._id || channel.id,
                followerCount: channel.stats?.followerCount || 0,
                postCount: channel.stats?.postCount || 0,
                verified: channel.verified || false,
                isOwner: channel.ownerId === localStorage.getItem('userId'),
                unreadCount: Math.floor(Math.random() * 3),
                lastActivity: getRandomActivity(),
                lastMessage: getRandomLastMessage(),
                isOnline: Math.random() > 0.3,
              }))
              
              set({ channels: apiChannels })
              return
            }
          }
        } catch (error) {
          console.error('❌ Failed to load channels from API:', error)
        }

        // Fallback sample data
        const sampleChannels: Channel[] = [
          {
            id: '1',
            name: 'Tech Hub',
            handle: '@tech-hub',
            description: 'Latest in technology and innovation',
            category: 'Tech',
            followerCount: 1250,
            postCount: 45,
            verified: true,
            isOwner: true,
            ownerId: localStorage.getItem('userId') || '',
            createdAt: '2024-01-15T10:00:00Z',
            lastActivity: '2h',
            unreadCount: 3,
            lastMessage: 'Check out the new AI announcement!',
            isOnline: true,
          },
          {
            id: '2',
            name: 'Design Community',
            handle: '@design-community',
            description: 'Creative minds sharing ideas',
            category: 'Entertainment',
            followerCount: 890,
            postCount: 128,
            verified: false,
            isOwner: false,
            ownerId: 'other-user-id',
            createdAt: '2024-02-01T14:30:00Z',
            lastActivity: '1d',
            unreadCount: 0,
            lastMessage: 'Love the new portfolio designs',
            isOnline: false,
          }
        ]
        
        set({ channels: sampleChannels })
        set({ isLoading: false })
      },

      createChannel: async (data) => {
        set({ isLoading: true })
        
        try {
          const channelData = {
            name: data.name,
            handle: data.handle.startsWith('@') ? data.handle : `@${data.handle}`,
            description: data.description,
            category: data.category,
            ownerId: localStorage.getItem('userId'),
            settings: {
              isPublic: true,
              allowComments: true,
              allowTips: true,
            },
          }

          const response = await fetch(`${API_BASE_URL}/api/v1/channels`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(channelData)
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const newChannel: Channel = {
                ...result.data,
                id: result.data._id || result.data.id,
                followerCount: 0,
                postCount: 0,
                verified: false,
                isOwner: true,
                ownerId: localStorage.getItem('userId') || '',
                lastActivity: 'now',
                unreadCount: 0,
                lastMessage: 'Channel created!',
                isOnline: true,
              }

              get().addChannel(newChannel)
              get().resetCreateForm()
              set({ showCreateModal: false, selectedChannel: newChannel })
              get().loadChannelMessages(newChannel.id)
              return
            }
          }
        } catch (error) {
          console.error('❌ Failed to create channel via API:', error)
        }

        // Fallback: create locally
        const newChannel: Channel = {
          id: Date.now().toString(),
          name: data.name,
          handle: data.handle.startsWith('@') ? data.handle : `@${data.handle}`,
          description: data.description,
          category: data.category,
          followerCount: 0,
          postCount: 0,
          verified: false,
          isOwner: true,
          ownerId: localStorage.getItem('userId') || '',
          createdAt: new Date().toISOString(),
          lastActivity: 'now',
          unreadCount: 0,
          lastMessage: 'Channel created!',
          isOnline: true,
        }

        get().addChannel(newChannel)
        get().resetCreateForm()
        set({ showCreateModal: false, selectedChannel: newChannel })
        
        set({ isLoading: false })
      },

      loadChannelMessages: async (channelId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/channels/${channelId}/messages`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              const apiMessages = data.data.map((msg: ApiMessageResponse) => ({
                id: msg._id || msg.id,
                userId: msg.userId,
                userName: msg.userName || msg.author?.name || 'Unknown User',
                message: msg.content || msg.message,
                timestamp: msg.createdAt || msg.timestamp,
                type: msg.type || 'user',
              }))

              set({ messages: apiMessages })
              
              // Join channel room via socket
              const { socket } = get()
              if (socket?.connected) {
                socket.emit('join-channel', {
                  channelId: channelId,
                  userId: localStorage.getItem('userId'),
                  userName: 'User', // Get from auth store
                })
              }
              return
            }
          }
        } catch (error) {
          console.error(`❌ Failed to load messages for channel ${channelId}:`, error)
        }

        // Fallback sample messages
        const sampleMessages: ChatMessage[] = [
          {
            id: '1',
            userId: 'system',
            userName: 'System',
            message: `Welcome to this channel! 🎉`,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'system',
          },
          {
            id: '2',
            userId: 'user1',
            userName: 'Alice Smith',
            message: 'Hey everyone! Excited to be here 🎉',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            type: 'user',
          }
        ]
        set({ messages: sampleMessages })

        // Join channel room via socket for fallback too
        const { socket } = get()
        if (socket?.connected) {
          socket.emit('join-channel', {
            channelId: channelId,
            userId: localStorage.getItem('userId'),
            userName: 'User',
          })
        }
      },

      sendMessage: async () => {
        const { newMessage, selectedChannel, socket } = get()
        
        if (!newMessage.trim() || !selectedChannel) return

        const messageData: ChatMessage = {
          id: Date.now().toString(),
          userId: localStorage.getItem('userId') || '',
          userName: 'User', // Get from auth store
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'user',
          channelId: selectedChannel.id,
        }

        // Optimistically add message
        get().addMessage(messageData)
        set({ newMessage: '' })

        try {
          // Send via API
          await fetch(`${API_BASE_URL}/api/v1/channels/${selectedChannel.id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: messageData.message,
              type: 'text',
            })
          })
        } catch (error) {
          console.error('❌ Failed to send message via API:', error)
        }

        // Send via socket
        if (socket?.connected) {
          socket.emit('send-message', messageData)
        }
      },

      followChannel: async (channelId) => {
        const { channels } = get()
        const channel = channels.find(c => c.id === channelId || c._id === channelId)
        
        if (!channel) return

        const isCurrentlyFollowing = channel.isFollowing
        const action = isCurrentlyFollowing ? 'unfollow' : 'follow'
        
        // Update locally first
        get().updateChannel(channelId, {
          isFollowing: !isCurrentlyFollowing,
          followerCount: Math.max(0, channel.followerCount + (isCurrentlyFollowing ? -1 : 1))
        })

        try {
          await fetch(`${API_BASE_URL}/api/v1/channels/${channelId}/${action}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (error) {
          console.error(`❌ Failed to ${action} channel:`, error)
          // Revert on error
          get().updateChannel(channelId, {
            isFollowing: isCurrentlyFollowing,
            followerCount: channel.followerCount
          })
        }
      },

      // Utility
      reset: () => set(initialState),
    })),
    {
      name: 'channels-store',
    }
  )
)

// Helper functions
function getRandomActivity() {
  const activities = ['2m', '5m', '1h', '2h', '3h', '1d', '2d']
  return activities[Math.floor(Math.random() * activities.length)]
}

function getRandomLastMessage() {
  const messages = [
    'Thanks for sharing!',
    'Looking forward to the update',
    'Great discussion today',
    'Check out the latest post',
    'Hello everyone! 👋',
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}