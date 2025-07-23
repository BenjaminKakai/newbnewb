// features/channels/components/ChannelsPage.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useChannelsStore } from '@/services/channelsStore'
import { useAuthStore } from '@/store/authStore'
import {
  Plus,
  Hash,
  Users,
  Send,
  Search,
  Settings,
  MoreVertical,
  Crown,
  Shield,
  Verified,
  MessageCircle,
  User,
  Wifi,
  WifiOff,
  Menu,
  Edit3,
  Phone,
  Bookmark,
  Archive,
  Bell,
} from 'lucide-react'

// Import components
import { ChannelsList } from './ChannelsList'
// import { ChatArea } from './ChatArea'
import { CreateChannelModal } from './CreateChannelModal'
import SidebarNav from '@/components/SidebarNav'

export const ChannelsPage: React.FC = () => {
  const { user, accessToken } = useAuthStore()
  const {
    selectedChannel,
    messages,
    newMessage,
    showCreateModal,
    isConnected,
    isConnecting,
    currentTab,
    initializeSocket,
    disconnectSocket,
    loadChannels,
    setNewMessage,
    sendMessage,
    setShowCreateModal,
    loadChannelMessages,
  } = useChannelsStore()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true)

  // Initialize socket and data when user/token available
  useEffect(() => {
    if (user && accessToken) {
      console.log('🚀 User authenticated, initializing socket and loading data...')
      initializeSocket(accessToken, user.id)
      loadChannels()
    } else {
      console.log('❌ No user or token available')
      disconnectSocket()
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket()
    }
  }, [user, accessToken, initializeSocket, loadChannels, disconnectSocket])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - maintaining socket connection')
      } else {
        console.log('📱 Page visible - checking socket connection')
        if (user && accessToken && !isConnected) {
          console.log('🔄 Reconnecting socket...')
          initializeSocket(accessToken, user.id)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, accessToken, isConnected, initializeSocket])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return
    await sendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Authentication Check
  if (!user || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500">Please log in to access channels</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Navigation Sidebar */}
      <SidebarNav
        onClose={() => setIsMobileSidebarOpen(false)}
        currentPath="/channels"
      />

      {/* Main Content Area */}
      <div
        className="flex flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobileSidebarOpen ? '4rem' : '0' }}
      >
        {/* Channels List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Header */}
          <div className="py-4 border-b border-gray-200">
            <div className="px-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Hash className="w-6 h-6 mr-2 text-blue-500" />
                  Channels
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Create Channel"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2 mb-3 text-sm">
                <div className="flex items-center space-x-1">
                  {isConnecting ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-yellow-600">Connecting...</span>
                    </>
                  ) : isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ChannelsList />
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col">
   

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No channel selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a channel from the sidebar to start chatting
                </p>
                {!isConnected && (
                  <div className="text-yellow-600">
                    <div className="animate-spin inline-block mr-2">🔄</div>
                    Connecting to channels...
                  </div>
                )}
              </div>
            </div>
        
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && <CreateChannelModal />}
    </div>
  )
}