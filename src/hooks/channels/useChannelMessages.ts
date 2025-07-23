  // features/channels/hooks/useChannelMessages.ts
  import { useEffect } from 'react'
  import { useChannelsStore } from '@/services/channelsStore'
  
  export const useChannelMessages = (channelId?: string) => {
    const {
      messages,
      selectedChannel,
      loadChannelMessages,
    } = useChannelsStore()
  
    useEffect(() => {
      if (channelId) {
        loadChannelMessages(channelId)
      }
    }, [channelId, loadChannelMessages])
  
    return {
      messages,
      selectedChannel,
    }
  }