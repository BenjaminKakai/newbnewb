// features/call/utils/index.ts

// Format call duration from seconds to MM:SS format
export const formatCallDuration = (seconds: number): string => {
    if (!seconds || seconds === 0) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Format date for call history display
  export const formatCallDate = (date: Date): string => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
  
    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    if (isYesterday) {
      return "Yesterday";
    }
  
    // If this week, show day name
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
  
    // Otherwise show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  
  // Format detailed date for call details view
  export const formatDetailedCallDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Generate call link
  export const generateCallLink = (callId?: string): string => {
    const id = callId || `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return `${window.location.origin}/join-call/${id}`;
  };
  
  // Get call status color
  export const getCallStatusColor = (status: string): string => {
    switch (status) {
      case "Incoming":
        return "text-green-500";
      case "Outgoing":
        return "text-blue-500";
      case "Missed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };
  
  // Get call status background color
  export const getCallStatusBgColor = (status: string): string => {
    switch (status) {
      case "Incoming":
        return "bg-green-100";
      case "Outgoing":
        return "bg-blue-100";
      case "Missed":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };
  
  // Check if browser supports WebRTC
  export const checkWebRTCSupport = (): { supported: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    if (!navigator.mediaDevices) {
      missing.push('MediaDevices API');
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      missing.push('getUserMedia');
    }
    
    if (!window.RTCPeerConnection) {
      missing.push('RTCPeerConnection');
    }
    
    if (!window.RTCSessionDescription) {
      missing.push('RTCSessionDescription');
    }
    
    if (!window.RTCIceCandidate) {
      missing.push('RTCIceCandidate');
    }
    
    return {
      supported: missing.length === 0,
      missing
    };
  };
  
  // Request media permissions
  export const requestMediaPermissions = async (video: boolean = true): Promise<{ granted: boolean; error?: string }> => {
    try {
      const constraints = {
        audio: true,
        video
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the stream immediately as we're just checking permissions
      stream.getTracks().forEach(track => track.stop());
      
      return { granted: true };
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      
      if (error instanceof Error) {
        return { 
          granted: false, 
          error: error.name === 'NotAllowedError' 
            ? 'Camera/microphone access denied. Please enable permissions in your browser settings.'
            : error.message 
        };
      }
      
      return { granted: false, error: 'Unknown error requesting permissions' };
    }
  };
  
  // Get device capabilities
  export const getDeviceCapabilities = async (): Promise<{
    hasAudio: boolean;
    hasVideo: boolean;
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
  }> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      return {
        hasAudio: audioDevices.length > 0,
        hasVideo: videoDevices.length > 0,
        audioDevices,
        videoDevices
      };
    } catch (error) {
      console.error('Error getting device capabilities:', error);
      return {
        hasAudio: false,
        hasVideo: false,
        audioDevices: [],
        videoDevices: []
      };
    }
  };
  
  // Validate user ID format
  export const isValidUserId = (userId: string): boolean => {
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId) || userId.length > 0; // Allow non-UUID formats too
  };
  
  // Get user display name
  export const getUserDisplayName = (userId: string, userName?: string): string => {
    if (userName) return userName;
    
    // Extract readable part from UUID or return shortened version
    if (userId.includes('-')) {
      return `User ${userId.split('-')[0]}`;
    }
    
    return `User ${userId.substring(0, 8)}`;
  };
  
  // Copy text to clipboard
  export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  };
  
  // Debounce function for search and other rapid events
  export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  // Throttle function for scroll events and similar
  export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };