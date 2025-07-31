import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  type?: "text" | "payment" | "image" | "video";
  paymentAmount?: string;
  imageId?: string;
  videoId?: string;
}

interface MessageListProps {
  messages: Message[];
  loadingHistory: boolean;
  activeConversation: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loadingHistory,
  activeConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
      const date =
        message.timestamp instanceof Date && !isNaN(message.timestamp.getTime())
          ? message.timestamp.toDateString()
          : "Unknown";
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-60 h-60 flex items-center justify-center mx-auto mb-4">
            <img
              src="/empty1.svg"
              alt="Group Avatar"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto text-[var(--foreground)] bg-[var(--background)] p-6 h-full space-y-4 relative"
    >
      <div
        className="absolute inset-0 bg-[url('/bg-vector.png')] bg-contain bg-center bg-repeat backdrop-brightness-75 dark:backdrop-brightness-50"
        style={{ zIndex: -1 }}
      ></div>
      {loadingHistory && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2A8FEA] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading message history...</p>
        </div>
      )}

      {Object.keys(groupedMessages).length === 0 && !loadingHistory ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([dateString, dayMessages]) => (
          <div key={dateString} className="space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                {formatDate(dateString)}
              </span>
            </div>

            {dayMessages.map((message, index) => {
              const showAvatar = !message.isOwn;
              const isLastInGroup =
                index === dayMessages.length - 1 ||
                dayMessages[index + 1].isOwn !== message.isOwn;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isOwn ? "justify-end" : "justify-start"
                  } ${showAvatar ? "mt-4" : "mt-1"}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                      message.isOwn ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {!message.isOwn && showAvatar && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-600">
                          {message.from.split("@")[0].charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex flex-col ${
                        message.isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {message.type === "payment" ? (
                        <div
                          className={`p-4 rounded-2xl shadow-md bg-[#2A8FEA] text-white max-w-xs`}
                        >
                          <div className="flex justify-between items-center bg-blue-400 rounded-full px-3 py-1 mb-2">
                            <span className="text-sm">
                              {message.isOwn
                                ? "You have sent"
                                : "You have received"}
                            </span>
                            <ChevronRightIcon className="w-4 h-4 text-white " />
                          </div>

                          <p className="text-xl font-bold">
                            Ksh {message.paymentAmount}
                          </p>
                        </div>
                      ) : message.type === "image" ? (
                        <div
                          className={`p-2 rounded-2xl ${
                            message.isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <img
                            src={message.imageId}
                            alt="Sent image"
                            className="max-w-full rounded"
                          />
                          <p className="text-sm mt-1">{message.text}</p>
                        </div>
                      ) : message.type === "video" ? (
                        <div
                          className={`p-2 rounded-2xl ${
                            message.isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <video
                            controls
                            src={message.videoId}
                            className="max-w-full rounded"
                          />
                          <p className="text-sm mt-1">{message.text}</p>
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-2 ${
                            message.isOwn
                              ? "bg-[#2A8FEA] text-white"
                              : "bg-gray-100 text-gray-900"
                          } ${
                            showAvatar && !message.isOwn
                              ? "rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                              : showAvatar && message.isOwn
                              ? "rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl"
                              : isLastInGroup && !message.isOwn
                              ? "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm"
                              : isLastInGroup && message.isOwn
                              ? "rounded-tl-2xl rounded-tr-2xl rounded-bl-sm rounded-br-2xl"
                              : message.isOwn
                              ? "rounded-tl-2xl rounded-tr-sm rounded-bl-sm rounded-br-2xl"
                              : "rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-sm"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      )}
                      {isLastInGroup && (
                        <div
                          className={`text-xs mt-1 ${
                            message.isOwn
                              ? "text-gray-500 text-right"
                              : "text-gray-500 text-left"
                          }`}
                        >
                          {message.timestamp instanceof Date &&
                          !isNaN(message.timestamp.getTime())
                            ? message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Unknown time"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
