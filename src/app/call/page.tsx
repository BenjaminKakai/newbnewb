"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Phone,
  Video,
  PhoneMissed,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import { useCallStore } from "@/store/callStore";
import { useSocket } from "@/hooks/useSocket";
import { useNotification } from "@/features/calls/components/NotificationContext";
import SidebarNav from "@/components/SidebarNav";

// 🌐 Configuration
const SERVER_IP = "calls-dev.wasaachat.com";
const API_BASE_URL = `https://${SERVER_IP}:9638/v1`;

interface IncomingCallData {
  callId: string;
  callerId: string;
  targetId: string;
  offer: RTCSessionDescriptionInit;
  callType?: "video" | "audio";
}

interface RemoteParticipant {
  id: string;
  name: string;
  stream: MediaStream;
  connectionState: RTCPeerConnectionState;
}

interface CallOfferData {
  callId: string;
  callerId: string;
  offer: RTCSessionDescriptionInit;
  callType?: "video" | "audio";
}

interface CallAnswerData {
  answer: RTCSessionDescriptionInit;
}

interface IceCandidateData {
  targetId: string;
  callId: string;
  candidate: RTCIceCandidate;
  senderId?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_name?: string;
}

interface CallHistoryItem {
  id: string;
  direction: "incoming" | "outgoing";
  otherPartyId: string;
  otherPartyName: string;
  type: "video" | "audio";
  status: "ended" | "missed" | "completed";
  duration: number;
  initiatedAt: string;
  startTime: string;
  endTime: string;
}

const Call: React.FC = () => {
  const pathname = usePathname();
  const { user, accessToken } = useAuthStore();
  const {
    contacts,
    friendRequests,
    getContactName,
    fetchContacts,
    fetchFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useContactsStore();
  const { callHistory, currentTab, setCurrentTab, fetchCallHistory } =
    useCallStore();
  const { addNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState({
    contacts: false,
    friendRequests: false,
    callHistory: false,
  });

  // Call state
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [peerConnections, setPeerConnections] = useState<
    Map<string, RTCPeerConnection>
  >(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // RTC Configuration
  const rtcConfig = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    }),
    []
  );

  // Enhanced logging function
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs((prev) => [...prev.slice(-25), logEntry]);
  }, []);

  // Socket connection
  const { socket, isConnected } = useSocket(accessToken, addLog);

  // Debounce function to limit API calls
  const debounce = useCallback(
    <T extends (...args: any[]) => any>(func: T, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        return new Promise((resolve) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => resolve(func(...args)), wait);
        });
      };
    },
    []
  );

  // Debounced fetch functions
  const debouncedFetchContacts = useMemo(
    () => debounce(fetchContacts, 1000),
    [fetchContacts]
  );
  const debouncedFetchFriendRequests = useMemo(
    () => debounce(fetchFriendRequests, 1000),
    [fetchFriendRequests]
  );
  const debouncedFetchCallHistory = useMemo(
    () => debounce(fetchCallHistory, 1000),
    [fetchCallHistory]
  );

  // Cleanup function
  const cleanupConnection = useCallback(() => {
    addLog("🧹 Cleaning up failed connection...");

    peerConnections.forEach((pc) => pc.close());
    setPeerConnections(new Map());
    setRemoteParticipants([]);
    setCurrentTargetId(null);
    setCurrentCallId(null);
    setIncomingCall(null);

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    addNotification("Call connection failed", "error");
  }, [peerConnections, localStream, addLog, addNotification]);

  // Media initialization
  const initMedia = useCallback(
    async (withVideo = true) => {
      try {
        addLog(`🎥 Initializing media (video: ${withVideo})`);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!withVideo) {
          stream.getVideoTracks().forEach((track) => {
            track.enabled = false;
            addLog("🔇 Video track disabled for audio-only call");
          });
        } else {
          stream.getVideoTracks().forEach((track) => {
            track.enabled = true;
            addLog("📹 Video track enabled for video call");
          });
        }
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch((e) => {
            addLog(`⚠️ Local video autoplay failed: ${e.message}`);
          });
          addLog("✅ Local video stream attached to element immediately");
        }
        addLog(
          `✅ Media stream created: ${stream.getTracks().length} tracks (${
            stream.getAudioTracks().length
          } audio, ${stream.getVideoTracks().length} video)`
        );
        return stream;
      } catch (error) {
        addLog(`❌ Media error: ${error}`);
        addNotification("Failed to access camera/microphone", "error");
        return null;
      }
    },
    [addLog, addNotification]
  );

  // End call function
  const endCall = useCallback(() => {
    addLog("📞 Ending call and cleaning up");

    if (socket && currentCallId && currentTargetId) {
      socket.emit("call-ended", {
        callId: currentCallId,
        targetId: currentTargetId,
      });
    }

    peerConnections.forEach((pc) => pc.close());
    setPeerConnections(new Map());
    setRemoteParticipants([]);
    setCurrentCallId(null);
    setCurrentTargetId(null);
    setIncomingCall(null);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setTimeout(() => {
      if (localStream) {
        addLog("🎥 Stopping local media tracks after call end");
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    }, 2000);

    addNotification("Call ended", "info");
  }, [
    socket,
    currentCallId,
    currentTargetId,
    peerConnections,
    localStream,
    addLog,
    addNotification,
  ]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleCallOffer = async (data: CallOfferData) => {
      addLog(`[DEBUG] call-offer received: ${JSON.stringify(data)}`);
      addLog(
        `📞 Incoming ${data.callType || "video"} call from ${data.callerId}`
      );

      try {
        setIncomingCall({
          callId: data.callId,
          callerId: data.callerId,
          targetId: user?.id || "",
          offer: data.offer,
          callType: data.callType,
        });

        addLog("✅ Incoming call modal displayed");

        if (data.offer.sdp) {
          const audioMatch = data.offer.sdp.match(/m=audio/g);
          const videoMatch = data.offer.sdp.match(/m=video/g);
          addLog(
            `📞 Offer contains: ${audioMatch?.length || 0} audio sections, ${
              videoMatch?.length || 0
            } video sections`
          );
        }
      } catch (error) {
        addLog(`❌ Error processing call offer: ${error}`);
      }
    };

    const handleCallAnswer = async (data: CallAnswerData) => {
      addLog(`📥 Call answer received`);
      const pc = peerConnections.get("direct-call");
      if (pc) {
        try {
          addLog(
            `📥 PC state before setting answer: connection=${pc.connectionState}, signaling=${pc.signalingState}`
          );

          const senders = pc.getSenders();
          addLog(`📥 Current senders before answer: ${senders.length}`);

          let hasAudioSender = false;
          let hasVideoSender = false;

          senders.forEach((sender, index) => {
            if (sender.track) {
              addLog(
                `📥   Sender ${index}: ${sender.track.kind} track (enabled: ${sender.track.enabled}, readyState: ${sender.track.readyState})`
              );
              if (sender.track.kind === "audio") hasAudioSender = true;
              if (sender.track.kind === "video") hasVideoSender = true;
            } else {
              addLog(`📥   Sender ${index}: No track`);
            }
          });

          if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            const videoTracks = localStream.getVideoTracks();

            if (audioTracks.length > 0 && !hasAudioSender) {
              addLog(`🔧 Re-adding missing audio track before answer`);
              pc.addTrack(audioTracks[0], localStream);
            }

            if (videoTracks.length > 0 && !hasVideoSender) {
              addLog(`🔧 Re-adding missing video track before answer`);
              pc.addTrack(videoTracks[0], localStream);
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          addLog("✅ Call answer processed successfully");
          addLog(
            `📥 PC state after setting answer: connection=${pc.connectionState}, signaling=${pc.signalingState}`
          );

          const sendersAfter = pc.getSenders();
          addLog(`📥 Senders after answer: ${sendersAfter.length}`);
          sendersAfter.forEach((sender, index) => {
            if (sender.track) {
              addLog(
                `📥   Sender ${index}: ${sender.track.kind} track (enabled: ${sender.track.enabled}, readyState: ${sender.track.readyState})`
              );
            } else {
              addLog(`📥   Sender ${index}: No track - TRACK LOST!`);
            }
          });
        } catch (error) {
          addLog(`❌ Failed to handle answer: ${error}`);
        }
      } else {
        addLog(`⚠️ No peer connection found for answer`);
      }
    };

    const handleCallEnded = () => {
      addLog("📞 Call ended by remote user");
      endCall();
    };

    const handleIceCandidate = async (data: IceCandidateData) => {
      addLog(`📥 ICE candidate received from ${data.senderId || "unknown"}`);
      addLog(
        `📥 ICE data: callId=${data.callId}, targetId=${data.targetId}, currentCallId=${currentCallId}, ourId=${user?.id}`
      );

      if (!data.callId) {
        addLog(`⚠️ ICE candidate ignored: missing callId in data`);
        return;
      }

      if (!currentCallId) {
        addLog(`⚠️ ICE candidate ignored: no current call ID`);
        return;
      }

      const isForCurrentCall = data.callId === currentCallId;
      const isForUs = data.targetId === user?.id;

      if (isForCurrentCall && isForUs) {
        const pc = peerConnections.get("direct-call");
        if (pc) {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              addLog(
                `📥 ICE candidate processed successfully for call ${data.callId}`
              );
            } else {
              addLog(`⚠️ Skipping ICE candidate - no remote description yet`);
            }
          } catch (error) {
            addLog(`❌ Failed to add ICE candidate: ${error}`);
          }
        } else {
          addLog(`⚠️ No peer connection found for ICE candidate`);
        }
      } else {
        addLog(`⚠️ ICE candidate ignored: not for current call or not for us`);
        addLog(`⚠️ Expected: callId=${currentCallId}, targetId=${user?.id}`);
        addLog(`⚠️ Received: callId=${data.callId}, targetId=${data.targetId}`);
      }
    };

    socket.on("call-offer", handleCallOffer);
    socket.on("call-answer", handleCallAnswer);
    socket.on("call-ended", handleCallEnded);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call-offer", handleCallOffer);
      socket.off("call-answer", handleCallAnswer);
      socket.off("call-ended", handleCallEnded);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    socket,
    user?.id,
    currentCallId,
    peerConnections,
    localStream,
    addLog,
    endCall,
  ]);

  // Initialize data when user changes
  useEffect(() => {
    if (user?.id) {
      addLog(`[CALL PAGE] Initializing for user: ${user.id}`);
      setIsFetching((prev) => ({
        ...prev,
        contacts: true,
        friendRequests: true,
        callHistory: true,
      }));
      Promise.all([
        debouncedFetchContacts().then(() =>
          setIsFetching((prev) => ({ ...prev, contacts: false }))
        ),
        debouncedFetchFriendRequests().then(() =>
          setIsFetching((prev) => ({ ...prev, friendRequests: false }))
        ),
        debouncedFetchCallHistory().then(() =>
          setIsFetching((prev) => ({ ...prev, callHistory: false }))
        ),
      ]).catch((error) => {
        addLog(`❌ Error initializing data: ${error}`);
        setIsFetching({
          contacts: false,
          friendRequests: false,
          callHistory: false,
        });
      });
    }
  }, [
    user?.id,
    debouncedFetchContacts,
    debouncedFetchFriendRequests,
    debouncedFetchCallHistory,
    addLog,
  ]);

  // Debug effects
  useEffect(() => {
    if (localStream) {
      addLog(
        `🎬 Local stream updated: ${localStream.getTracks().length} tracks`
      );
      localStream.getTracks().forEach((track, index) => {
        addLog(
          `🎬 Track ${index}: ${track.kind} (enabled: ${track.enabled}, readyState: ${track.readyState})`
        );
      });
    } else {
      addLog(`🎬 Local stream cleared`);
    }
  }, [localStream, addLog]);

  useEffect(() => {
    if (remoteParticipants.length > 0) {
      addLog(
        `🎬 Remote participants updated: ${remoteParticipants.length} participants`
      );
      remoteParticipants.forEach((participant, index) => {
        addLog(
          `🎬 Participant ${index}: ${participant.name} (id: ${participant.id}, connectionState: ${participant.connectionState})`
        );
        if (participant.stream) {
          addLog(
            `🎬 Participant stream: ${
              participant.stream.getTracks().length
            } tracks`
          );
        }
      });
    } else {
      addLog(`🎬 No remote participants`);
    }
  }, [remoteParticipants, addLog]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      addLog(`🎬 Local video element updated with stream`);
    }
  }, [localStream, addLog]);

  useEffect(() => {
    if (remoteParticipants.length > 0 && remoteVideoRef.current) {
      const remoteStream = remoteParticipants[0].stream;
      remoteVideoRef.current.srcObject = remoteStream;
      addLog(`🎬 Remote video element updated with stream`);
    }
  }, [remoteParticipants, addLog]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioMuted;
        addLog(
          `🎤 Audio track ${
            track.enabled ? "enabled" : "disabled"
          } (track ID: ${track.id})`
        );
      });
      setIsAudioMuted(!isAudioMuted);
      addLog(
        `🎤 Audio ${isAudioMuted ? "unmuted" : "muted"} - ${
          localStream.getAudioTracks().length
        } tracks`
      );
    } else {
      addLog(`⚠️ No local stream available for audio toggle`);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
        addLog(
          `📹 Video track ${
            track.enabled ? "enabled" : "disabled"
          } (track ID: ${track.id})`
        );
      });
      setIsVideoOff(!isVideoOff);
      addLog(
        `📹 Video ${isVideoOff ? "enabled" : "disabled"} - ${
          localStream.getVideoTracks().length
        } tracks`
      );
    } else {
      addLog(`⚠️ No local stream available for video toggle`);
    }
  };

  const debugWebRTCState = useCallback(() => {
    addLog("🔍 === WebRTC State Debug ===");
    addLog(`🔍 Current Call ID: ${currentCallId || "None"}`);
    addLog(`🔍 Current Target ID: ${currentTargetId || "None"}`);
    addLog(`🔍 Local Stream: ${localStream ? "Present" : "None"}`);
    addLog(`🔍 Remote Participants: ${remoteParticipants.length}`);
    addLog(`🔍 Peer Connections: ${peerConnections.size}`);

    if (localStream) {
      addLog(`🔍 Local Stream Tracks: ${localStream.getTracks().length}`);
      localStream.getTracks().forEach((track, index) => {
        addLog(
          `🔍   Track ${index}: ${track.kind} (enabled: ${track.enabled}, readyState: ${track.readyState}, id: ${track.id})`
        );
      });
    }

    peerConnections.forEach((pc, key) => {
      addLog(`🔍 Peer Connection [${key}]:`);
      addLog(`🔍   Connection State: ${pc.connectionState}`);
      addLog(`🔍   ICE Connection State: ${pc.iceConnectionState}`);
      addLog(`🔍   ICE Gathering State: ${pc.iceGatheringState}`);
      addLog(`🔍   Signaling State: ${pc.signalingState}`);

      const senders = pc.getSenders();
      const receivers = pc.getReceivers();
      addLog(`🔍   Senders: ${senders.length}, Receivers: ${receivers.length}`);

      senders.forEach((sender, index) => {
        if (sender.track) {
          addLog(
            `🔍   Sender ${index}: ${sender.track.kind} track (enabled: ${sender.track.enabled}, readyState: ${sender.track.readyState}, id: ${sender.track.id})`
          );
        } else {
          addLog(`🔍   Sender ${index}: No track - MISSING!`);
        }
      });

      receivers.forEach((receiver, index) => {
        if (receiver.track) {
          addLog(
            `🔍   Receiver ${index}: ${receiver.track.kind} track (readyState: ${receiver.track.readyState}, id: ${receiver.track.id})`
          );
        } else {
          addLog(`🔍   Receiver ${index}: No track`);
        }
      });
    });

    addLog("🔍 === End Debug ===");
  }, [
    currentCallId,
    currentTargetId,
    localStream,
    remoteParticipants,
    peerConnections,
    addLog,
  ]);

  const monitorLocalTracks = useCallback(() => {
    if (currentCallId && localStream && peerConnections.size > 0) {
      const pc = peerConnections.get("direct-call");
      if (pc) {
        const senders = pc.getSenders();
        const hasAudioSender = senders.some(
          (s) => s.track && s.track.kind === "audio"
        );
        const hasVideoSender = senders.some(
          (s) => s.track && s.track.kind === "video"
        );
        const localAudioTracks = localStream.getAudioTracks().length;
        const localVideoTracks = localStream.getVideoTracks().length;

        if (localAudioTracks > 0 && !hasAudioSender) {
          addLog("⚠️ TRACK MONITOR: Missing audio sender, re-adding...");
          localStream.getAudioTracks().forEach((track) => {
            pc.addTrack(track, localStream);
            addLog(`🔧 Re-added audio track: ${track.id}`);
          });
        }

        if (localVideoTracks > 0 && !hasVideoSender) {
          addLog("⚠️ TRACK MONITOR: Missing video sender, re-adding...");
          localStream.getVideoTracks().forEach((track) => {
            pc.addTrack(track, localStream);
            addLog(`🔧 Re-added video track: ${track.id}`);
          });
        }
      }
    }
  }, [currentCallId, localStream, peerConnections, addLog]);

  useEffect(() => {
    if (currentCallId) {
      const interval = setInterval(monitorLocalTracks, 2000);
      return () => clearInterval(interval);
    }
  }, [currentCallId, monitorLocalTracks]);

  const formatCallTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 86400000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString();
  };

  const formatRequestTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredCallHistory = callHistory.filter((call) => {
    if (currentTab === "all") return true;
    if (currentTab === "incoming") return call.type === "incoming";
    if (currentTab === "missed") return call.status === "missed";
    if (currentTab === "pending") return call.status === "completed" && call.type === "outgoing";
    if (currentTab === "requests") return call.type === "incoming" && call.status !== "missed";
    return true;
  });

  const filteredContacts = contacts.filter((contact, index, array) => {
    const isFirstOccurrence =
      array.findIndex((c) => c.contact_id === contact.contact_id) === index;
    const matchesSearch = getContactName(contact.contact_id, user?.id)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return isFirstOccurrence && matchesSearch;
  });

  const filteredFriendRequests = friendRequests.filter((request) =>
    (request.sender_name || request.sender_id)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!localStream && !currentCallId && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, currentCallId]);

  const ensureLocalMedia = useCallback(
    async (withVideo: boolean) => {
      if (localStream) {
        localStream
          .getVideoTracks()
          .forEach((track) => (track.enabled = withVideo));
        return localStream;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!withVideo)
        stream.getVideoTracks().forEach((track) => (track.enabled = false));
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
      return stream;
    },
    [localStream]
  );

  const startDirectCall = async (
    recipientId: string,
    callType: "video" | "audio"
  ) => {
    if (!isConnected) {
      addNotification("Not connected to server", "error");
      return;
    }
    try {
      addLog(`🚀 Starting ${callType} call to ${recipientId}`);
      const stream = await ensureLocalMedia(callType === "video");
      if (!stream) throw new Error("Failed to initialize media");
      const response = await fetch(`${API_BASE_URL}/calls`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: recipientId,
          callType,
          settings: { video: callType === "video", audio: true },
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      addLog(`✅ Call API successful: ${JSON.stringify(result)}`);
      const callId = result.data?.callId;
      if (!callId) throw new Error("No callId received from API");
      addLog(`🔗 Starting call with ID: ${callId} to: ${recipientId}`);
      setCurrentCallId(callId);
      setCurrentTargetId(recipientId);
      addLog(
        `🔗 Creating peer connection for outgoing call to: ${recipientId}`
      );
      const pc = new RTCPeerConnection(rtcConfig);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        addLog(
          `📤 Added ${track.kind} track to peer connection (enabled: ${track.enabled})`
        );
      });
      addLog(`📤 Total tracks added: ${stream.getTracks().length}`);
      pc.ontrack = (event) => {
        addLog(`📥 *** ONTRACK EVENT FIRED FOR OUTGOING CALL ***`);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          setRemoteParticipants([
            {
              id: recipientId,
              name: getContactName(recipientId, user?.id) || "Remote User",
              stream: remoteStream,
              connectionState: pc.connectionState,
            },
          ]);
          addLog("✅ Remote participant updated with stream");
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(
            `📤 Sending ICE candidate to ${recipientId} for call ${callId}`
          );
          socket?.emit("ice-candidate", {
            callId: callId,
            targetId: recipientId,
            candidate: event.candidate,
            senderId: user?.id,
          });
        } else {
          addLog("📤 ICE gathering completed");
        }
      };
      pc.onconnectionstatechange = () => {
        addLog(`🔄 Connection state: ${pc.connectionState}`);
        if (pc.connectionState === "connected") {
          addNotification("Call connected successfully", "success");
          addLog("🎉 WebRTC connection fully established");
        } else if (pc.connectionState === "failed") {
          addLog("❌ WebRTC connection failed");
          cleanupConnection();
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      addLog(`✅ Created offer`);
      addLog(
        `📤 PC state after creating offer: connection=${pc.connectionState}, signaling=${pc.signalingState}`
      );
      setPeerConnections(new Map([["direct-call", pc]]));
      socket?.emit("call-offer", {
        callId: callId,
        targetId: recipientId,
        offer: offer,
        callerId: user?.id,
        callType,
      });
      addLog(
        `[DEBUG] call-offer emitted to ${recipientId} with callId: ${callId}`
      );
      addLog(
        `🎉 ${callType} call initiated to ${recipientId} with callId: ${callId}`
      );
      addNotification(`Starting ${callType} call...`, "info");
    } catch (error) {
      addLog(`❌ Call failed: ${error}`);
      addNotification("Failed to start call", "error");
      setCurrentTargetId(null);
      endCall();
    }
  };

  const acceptCall = useCallback(
    async (callData: IncomingCallData) => {
      try {
        addLog("✅ Accepting incoming call");
        const callId = callData.callId;
        const callerId = callData.callerId;
        if (!callId || !callerId) {
          throw new Error(
            `Missing required call data: callId=${callId}, callerId=${callerId}`
          );
        }
        addLog(`🔗 Accepting call with ID: ${callId} from: ${callerId}`);
        setCurrentCallId(callId);
        setCurrentTargetId(callerId);
        setIncomingCall(null);

        addLog(
          `🔗 Creating peer connection for incoming call from: ${callerId}`
        );
        const pc = new RTCPeerConnection(rtcConfig);

        pc.ontrack = (event) => {
          addLog(`📥 *** ONTRACK EVENT FIRED FOR INCOMING CALL ***`);
          addLog(
            `📥 Received remote ${event.track.kind} track (readyState: ${event.track.readyState})`
          );
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              addLog("✅ Remote video stream attached to element");
              remoteVideoRef.current
                .play()
                .catch((e) =>
                  addLog(`⚠️ Remote video autoplay failed: ${e.message}`)
                );
            }
            setRemoteParticipants([
              {
                id: callData.callerId,
                name:
                  getContactName(callData.callerId, user?.id) || "Remote User",
                stream: remoteStream,
                connectionState: pc.connectionState,
              },
            ]);
            addLog("✅ Remote participant updated with stream");
          }
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addLog(
              `📤 Sending ICE candidate to ${callerId} for call ${callId}`
            );
            socket?.emit("ice-candidate", {
              callId: callId,
              targetId: callerId,
              candidate: event.candidate,
              senderId: user?.id,
            });
          } else {
            addLog("📤 ICE gathering completed");
          }
        };
        pc.onconnectionstatechange = () => {
          addLog(`🔄 Connection state: ${pc.connectionState}`);
          if (pc.connectionState === "connected") {
            addNotification("Call connected successfully", "success");
            addLog("🎉 WebRTC connection fully established");
          } else if (pc.connectionState === "failed") {
            addLog("❌ WebRTC connection failed");
            cleanupConnection();
          }
        };

        addLog(
          `📥 Setting remote description (offer) from ${callData.callerId}`
        );
        await pc.setRemoteDescription(
          new RTCSessionDescription(callData.offer)
        );
        addLog(`✅ Remote description set successfully`);

        addLog("🎥 Getting local media for answer");
        const stream = await initMedia(callData.callType !== "audio");
        if (!stream) throw new Error("Failed to initialize media");

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
          addLog(
            `📤 Added ${track.kind} track to peer connection (enabled: ${track.enabled})`
          );
        });
        addLog(`📤 Total tracks added: ${stream.getTracks().length}`);

        addLog("📤 Creating answer");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        addLog(`✅ Answer created and set as local description`);

        socket?.emit("call-answer", {
          callId: callId,
          targetId: callerId,
          answer: answer,
          receiverId: user?.id,
        });

        setPeerConnections(new Map([["direct-call", pc]]));
        addLog("✅ Call accepted and answer sent");
        addNotification("Call accepted", "success");
      } catch {
        addNotification("Failed to accept call", "error");
        setCurrentTargetId(null);
        endCall();
      }
    },
    [
      rtcConfig,
      initMedia,
      socket,
      user?.id,
      addNotification,
      cleanupConnection,
      endCall,
      getContactName,
      addLog,
    ]
  );

  const rejectCall = useCallback(
    (callData: IncomingCallData) => {
      socket?.emit("call-rejected", {
        callId: callData.callId,
        targetId: callData.callerId,
      });
      setIncomingCall(null);
      addLog("📞 Call rejected");
    },
    [socket, addLog]
  );

  if (
    (localStream || currentCallId) &&
    (remoteParticipants.length > 0 || currentCallId)
  ) {
    return (
      <div className="h-screen bg-black flex flex-col">
        <div className="p-4 text-white text-center">
          <h2 className="text-xl font-semibold">
            {remoteParticipants[0]?.name || "Call in Progress"}
          </h2>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
          </div>
          <div className="text-xs mt-1 space-x-4">
            <span>Local Stream: {localStream ? "✅" : "❌"}</span>
            <span>Remote Participants: {remoteParticipants.length}</span>
            <span>Call ID: {currentCallId || "None"}</span>
          </div>
        </div>

        <div className="flex-1 relative flex flex-row items-center justify-center gap-8 bg-black">
          <div className="flex-1 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-[60vh] max-w-3xl object-cover bg-gray-800 rounded-xl border-4 border-blue-700 shadow-lg"
              style={{
                display: remoteParticipants.length > 0 ? "block" : "none",
              }}
            />
            {remoteParticipants.length === 0 && (
              <div className="w-full h-[60vh] max-w-3xl flex items-center justify-center bg-gray-800 text-white rounded-xl border-4 border-blue-700 shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">📞</div>
                  <p className="text-xl">Connecting...</p>
                  <p className="text-sm mt-2">
                    {currentCallId ? `Call ID: ${currentCallId}` : "No call ID"}
                  </p>
                  <p className="text-sm">
                    {currentTargetId
                      ? `Target: ${currentTargetId}`
                      : "No target ID"}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="w-64 h-48 bg-gray-900 rounded-xl overflow-hidden border-4 border-green-600 shadow-xl flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: localStream ? "block" : "none" }}
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <span className="text-white text-lg">📹</span>
                  <p className="text-white text-xs mt-1">No Camera</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-900">
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isAudioMuted
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {isAudioMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--background)] text-[var(--foreground)] flex">
      <SidebarNav onClose={() => {}} currentPath={pathname} />

      {localStream && !currentCallId && (
        <div className="fixed bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden z-40 border-2 border-gray-300">
          <video
            ref={(el) => {
              if (el && localStream) {
                el.srcObject = localStream;
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Camera Preview
          </div>
          <button
            onClick={() => {
              if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
                setLocalStream(null);
                addLog("📹 Camera preview stopped");
              }
            }}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
          >
            ×
          </button>
        </div>
      )}

      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">📞</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Incoming Call
              </h2>
              <p className="text-gray-600 mb-6">
                {incomingCall.callType || "Video"} call from{" "}
                {getContactName(incomingCall.callerId, user?.id)}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => rejectCall(incomingCall)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  ❌ Decline
                </button>
                <button
                  onClick={() => acceptCall(incomingCall)}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  ✅ Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 ml-20">
        <div className="w-96 flex flex-col bg-[var(--background)] text-[var(--foreground)]">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Contacts</h1>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts or requests"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 text-black border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {(
                ["all", "incoming", "missed", "pending", "requests", "friend-requests"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    currentTab === tab
                      ? "bg-blue-500 text-white"
                      : "border border-blue-500 hover:bg-gray-100"
                  }`}
                >
                  {tab === "all" && "All Calls"}
                  {tab === "incoming" && "Incoming"}
                  {tab === "missed" && "Missed"}
                  {tab === "pending" && "Pending"}
                  {tab === "requests" && "Requests"}
                  {tab === "friend-requests" && "Friend Requests"}
                </button>
              ))}
            </div>
          </div>

          {currentTab === "friend-requests" ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4">
                <h2 className="text-lg font-medium mb-4">Friend Requests</h2>
                {filteredFriendRequests.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFriendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center space-x-3 py-3 hover:bg-gray-50 hover:dark:bg-black rounded-lg px-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                          {(request.sender_name || request.sender_id)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {request.sender_name || request.sender_id}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatRequestTime(request.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => acceptFriendRequest(request.id)}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                            title="Accept Friend Request"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Reject Friend Request"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-2xl mb-2">👥</div>
                    <p className="text-sm">No friend requests</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="border-b-[1px] border-gray-50">
                {filteredCallHistory.length > 0 ? (
                  <div className="px-4 py-2">
                    {filteredCallHistory.slice(0, 4).map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center space-x-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                          {getContactName(call.participantId, user?.id)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {getContactName(call.participantId, user?.id)}
                          </h3>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {call.status === "missed" && (
                              <PhoneMissed className="w-3 h-3 text-red-500" />
                            )}
                            <span>
                              {call.status === "missed"
                                ? "Missed call"
                                : `${
                                    call.callType.charAt(0).toUpperCase() +
                                    call.callType.slice(1)
                                  } ${call.status}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCallTime(call.timestamp.toISOString())}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="text-2xl mb-2">📞</div>
                    <p className="text-sm">No {currentTab} calls</p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-4">
                  <h2 className="text-lg font-medium mb-4">All Contacts</h2>
                  {filteredContacts.length > 0 ? (
                    <div className="space-y-2">
                      {filteredContacts.map((contact) => {
                        const contactName = getContactName(
                          contact.contact_id,
                          user?.id
                        );

                        return (
                          <div
                            key={contact.contact_id}
                            className="flex items-center space-x-3 py-3 hover:bg-gray-50 hover:cursor-pointer rounded-lg px-2"
                          >
                            <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                              {contactName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-[var(--foreground)] capitalize text-sm truncate">
                                {contactName}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {contact.phone_number || 'No phone number'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  startDirectCall(contact.contact_id, "audio")
                                }
                                className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                title="Voice Call"
                                disabled={!isConnected}
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  startDirectCall(contact.contact_id, "video")
                                }
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                title="Video Call"
                                disabled={!isConnected}
                              >
                                <Video className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">👥</div>
                      <p className="text-sm">No contacts found</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="mb-4">
                {currentTab === "friend-requests"
                  ? "Manage your friend requests"
                  : "Select a contact to start a call"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Call;