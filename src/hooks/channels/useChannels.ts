  // features/channels/hooks/useChannels.ts
  import { useEffect } from 'react'
  import { useChannelsStore } from '@/stores/channelsStore'
  import { useAuthStore } from '@/stores/authStore'
  
  export const useChannels = () => {
    const { user, accessToken } = useAuthStore()
    const {
      channels,
      selectedChannel,
      isConnected,
      isLoading,
      loadChannels,
      initializeSocket,
      disconnectSocket,
    } = useChannelsStore()
  
    // Initialize when authenticated
    useEffect(() => {
      if (user && accessToken) {
        loadChannels()
        initializeSocket(accessToken, user.id)
      } else {
        disconnectSocket()
      }
  
      return () => {
        disconnectSocket()
      }
    }, [user, accessToken])
  
    return {
      channels,
      selectedChannel,
      isConnected,
      isLoading,
      // You can add more computed values or helper functions here
    }
  }