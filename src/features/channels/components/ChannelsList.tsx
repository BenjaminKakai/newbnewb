// features/channels/components/ChannelsList.tsx
'use client'

import React, { useMemo } from 'react'
import { useChannelsStore } from '@/services/channelsStore'
import {
  Search,
  Users,
  Crown,
  Verified,
  Hash,
  MoreVertical,
} from 'lucide-react'

const categories = [
  { value: 'Tech', label: '📱 Technology', color: 'bg-blue-500' },
  { value: 'Entertainment', label: '🎬 Entertainment', color: 'bg-purple-500' },
  { value: 'Education', label: '📚 Education', color: 'bg-green-500' },
  { value: 'Business', label: '💼 Business', color: 'bg-gray-500' },
  { value: 'Lifestyle', label: '🌟 Lifestyle', color: 'bg-pink-500' },
  { value: 'Gaming', label: '🎮 Gaming', color: 'bg-indigo-500' },
  { value: 'Sports', label: '⚽ Sports', color: 'bg-orange-500' },
  { value: 'Other', label: '📂 Other', color: 'bg-gray-400' },
]

export const ChannelsList: React.FC = () => {
  const {
    channels,
    selectedChannel,
    searchQuery,
    activeFilter,
    selectChannel,
    setSearchQuery,
    setActiveFilter,
    loadChannelMessages,
    updateChannel,
  } = useChannelsStore()

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesSearch =
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description.toLowerCase().includes(searchQuery.toLowerCase())

      switch (activeFilter) {
        case 'unread':
          return matchesSearch && (channel.unreadCount || 0) > 0
        case 'owned':
          return matchesSearch && channel.isOwner
        case 'followed':
          return matchesSearch && !channel.isOwner
        default:
          return matchesSearch
      }
    })
  }, [channels, searchQuery, activeFilter])

  const filterCounts = useMemo(() => {
    return {
      all: channels.length,
      unread: channels.filter((c) => (c.unreadCount || 0) > 0).length,
      owned: channels.filter((c) => c.isOwner).length,
      followed: channels.filter((c) => !c.isOwner).length,
    }
  }, [channels])

  const handleChannelSelect = async (channel: any) => {
    selectChannel(channel)
    await loadChannelMessages(channel.id)

    // Clear unread count
    updateChannel(channel.id, { unreadCount: 0 })
  }

  const getCategoryInfo = (category: string) => {
    return categories.find((cat) => cat.value === category) || categories[0]
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Search Bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 mb-3">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: filterCounts.all },
            { key: 'unread', label: 'Unread', count: filterCounts.unread },
            { key: 'owned', label: 'Owned', count: filterCounts.owned },
            { key: 'followed', label: 'Following', count: filterCounts.followed },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === filter.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 text-gray-400">({filter.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Hash className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No channels found
            </h3>
            <p className="text-xs text-gray-500">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first channel to get started'}
            </p>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const categoryInfo = getCategoryInfo(channel.category)
            return (
              <div
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={`px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                  selectedChannel?.id === channel.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Channel Avatar */}
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${categoryInfo.color}`}
                    >
                      {channel.name.charAt(0).toUpperCase()}
                    </div>
                    {channel.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {channel.name}
                        </h3>
                        {channel.verified && (
                          <Verified className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {channel.isOwner && (
                          <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {channel.lastActivity}
                        </span>
                        {channel.unreadCount && channel.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center">
                            {channel.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {channel.lastMessage || channel.description}
                    </p>

                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {channel.followerCount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {channel.handle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}