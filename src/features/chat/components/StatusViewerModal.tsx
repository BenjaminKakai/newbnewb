import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  MessageCircle,
  Share,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react';

interface StatusItem {
  id: string;
  type: 'text' | 'image' | 'video';
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

interface StatusUser {
  id: string;
  name: string;
  avatar?: string;
  statuses: StatusItem[];
}

interface StatusViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusUser: StatusUser | null;
  allStatusUsers: StatusUser[];
  currentUserIndex: number;
}

const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  isOpen,
  onClose,
  statusUser,
  allStatusUsers,
  currentUserIndex
}) => {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(statusUser);
  const [userIndex, setUserIndex] = useState(currentUserIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);

  const statusDuration = 5000; // 5 seconds per status

  useEffect(() => {
    if (statusUser) {
      setCurrentUser(statusUser);
      setCurrentStatusIndex(0);
      setProgress(0);
    }
  }, [statusUser]);

  useEffect(() => {
    if (!isOpen || !isPlaying || !currentUser?.statuses.length) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (statusDuration / 100));
        
        if (newProgress >= 100) {
          // Move to next status or next user
          if (currentStatusIndex < currentUser.statuses.length - 1) {
            setCurrentStatusIndex(prev => prev + 1);
            return 0;
          } else {
            // Move to next user
            if (userIndex < allStatusUsers.length - 1) {
              const nextUserIndex = userIndex + 1;
              setUserIndex(nextUserIndex);
              setCurrentUser(allStatusUsers[nextUserIndex]);
              setCurrentStatusIndex(0);
              return 0;
            } else {
              // Close modal when all statuses are viewed
              onClose();
              return 0;
            }
          }
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, currentStatusIndex, currentUser, userIndex, allStatusUsers, onClose]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const goToPreviousStatus = () => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex(prev => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      const prevUserIndex = userIndex - 1;
      setUserIndex(prevUserIndex);
      setCurrentUser(allStatusUsers[prevUserIndex]);
      setCurrentStatusIndex(allStatusUsers[prevUserIndex].statuses.length - 1);
      setProgress(0);
    }
  };

  const goToNextStatus = () => {
    if (currentStatusIndex < (currentUser?.statuses.length || 0) - 1) {
      setCurrentStatusIndex(prev => prev + 1);
      setProgress(0);
    } else if (userIndex < allStatusUsers.length - 1) {
      const nextUserIndex = userIndex + 1;
      setUserIndex(nextUserIndex);
      setCurrentUser(allStatusUsers[nextUserIndex]);
      setCurrentStatusIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReaction = (emoji: string) => {
    console.log(`Reacted with ${emoji} to status ${currentUser?.statuses[currentStatusIndex]?.id}`);
    setShowReactions(false);
    // TODO: Implement reaction functionality
  };

  const handleShare = () => {
    console.log('Sharing status:', currentUser?.statuses[currentStatusIndex]?.id);
    // TODO: Implement share functionality
  };

  if (!isOpen || !currentUser) return null;

  const currentStatus = currentUser.statuses[currentStatusIndex];
  const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-10">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2">
          {currentUser.statuses.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: index === currentStatusIndex ? `${progress}%` : 
                         index < currentStatusIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 mt-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{currentUser.name}</h3>
            <p className="text-white/70 text-sm">{formatTimeAgo(currentStatus.timestamp)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={togglePlayPause}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Navigation Areas */}
        <button
          onClick={goToPreviousStatus}
          className="absolute left-0 top-0 w-1/3 h-full z-20 flex items-center justify-start pl-4"
          disabled={userIndex === 0 && currentStatusIndex === 0}
        >
          {/* Left tap area - invisible */}
        </button>

        <button
          onClick={goToNextStatus}
          className="absolute right-0 top-0 w-1/3 h-full z-20 flex items-center justify-end pr-4"
        >
          {/* Right tap area - invisible */}
        </button>

        {/* Status Content */}
        {currentStatus.type === 'text' ? (
          <div 
            className={`w-full h-full flex items-center justify-center p-8 ${currentStatus.font || 'font-sans'}`}
            style={{ 
              backgroundColor: currentStatus.backgroundColor,
              color: currentStatus.textColor 
            }}
          >
            <div className="text-center max-w-md">
              <p className="text-2xl font-medium leading-relaxed break-words">
                {currentStatus.content}
              </p>
            </div>
          </div>
        ) : currentStatus.type === 'image' ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={currentStatus.imageUrl}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              src={currentStatus.videoUrl}
              autoPlay={isPlaying}
              muted
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">React</span>
            </button>
            
            <button className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-full transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Reply</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <Share className="w-5 h-5" />
          </button>
        </div>

        {/* Reaction Picker */}
        {showReactions && (
          <div className="mt-4 flex justify-center">
            <div className="bg-black/80 rounded-full px-4 py-2 flex space-x-3">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="mt-2 text-center">
          <p className="text-white/70 text-sm">
            {currentStatus.views} views • {currentStatusIndex + 1} of {currentUser.statuses.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusViewerModal;