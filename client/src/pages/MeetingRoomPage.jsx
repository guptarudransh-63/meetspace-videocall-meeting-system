import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useRoomContext,
  useLocalParticipant,
  VideoTrack,
  isTrackReference
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  Hand,
  PhoneOff,
  ShieldCheck,
  UserCheck,
  UserX,
  Send,
  Clock,
  AlertTriangle,
  X
} from "lucide-react";
import { getSocket } from "../services/socket.js";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
const RoomContent = ({ meetingCode, displayName, role, meetingTitle }) => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState("none");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);
  const [waitingList, setWaitingList] = useState(
    []
  );
  const [raisedHands, setRaisedHands] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false }
  ]);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    const socket = getSocket();
    const identity = localParticipant?.identity || (user ? `user-${user.id}` : `guest-${Date.now()}`);
    socket.emit("join-room", {
      meetingCode,
      participantIdentity: identity,
      displayName,
      role,
      userId: user?.id
    });
    api.getChatHistory(meetingCode).then((res) => {
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    });
    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activeDrawer !== "chat") {
        setUnreadChatCount((prev) => prev + 1);
      }
    });
    socket.on("hand-toggled", (data) => {
      setRaisedHands((prev) => ({ ...prev, [data.participantIdentity]: data.raised }));
    });
    socket.on("participant-waiting", (data) => {
      if (role === "host" || role === "co-host") {
        setWaitingList((prev) => {
          if (prev.some((p) => p.displayName === data.displayName)) return prev;
          return [...prev, data];
        });
      }
    });
    socket.on("waiting-room-list", (list) => {
      if (role === "host" || role === "co-host") {
        setWaitingList(list.map((item) => ({ id: item._id, displayName: item.displayName, participantIdentity: `guest-${item._id}` })));
      }
    });
    socket.on("waiting-room-update", (data) => {
      setWaitingList((prev) => prev.filter((p) => p.participantIdentity !== data.admittedIdentity));
    });
    socket.on("meeting-ended-by-host", (data) => {
      alert(data.message || "The host has ended this meeting.");
      navigate("/dashboard");
    });
    socket.on("participant-removed", (data) => {
      if (data.participantIdentity === identity) {
        alert("You have been removed from this meeting by the host.");
        navigate("/dashboard");
      }
    });
    return () => {
      socket.off("new-message");
      socket.off("hand-toggled");
      socket.off("participant-waiting");
      socket.off("waiting-room-list");
      socket.off("waiting-room-update");
      socket.off("meeting-ended-by-host");
      socket.off("participant-removed");
    };
  }, [meetingCode, displayName, role, user, localParticipant?.identity, activeDrawer, navigate]);
  useEffect(() => {
    if (activeDrawer === "chat") {
      setUnreadChatCount(0);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeDrawer]);
  const toggleMic = async () => {
    if (localParticipant) {
      const nextState = !isMicOn;
      await localParticipant.setMicrophoneEnabled(nextState);
      setIsMicOn(nextState);
    }
  };
  const toggleCamera = async () => {
    if (localParticipant) {
      const nextState = !isCameraOn;
      await localParticipant.setCameraEnabled(nextState);
      setIsCameraOn(nextState);
    }
  };
  const toggleScreenShare = async () => {
    if (localParticipant) {
      const nextState = !isScreenSharing;
      try {
        await localParticipant.setScreenShareEnabled(nextState);
        setIsScreenSharing(nextState);
      } catch (err) {
        console.warn("Screen share canceled or failed:", err);
      }
    }
  };
  const toggleHandRaise = () => {
    const socket = getSocket();
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket.emit("raise-hand", { meetingCode, raised: nextState });
  };
  const handleAdmit = (participant) => {
    const socket = getSocket();
    socket.emit("admit-participant", {
      meetingCode,
      displayName: participant.displayName,
      participantIdentity: participant.participantIdentity
    });
    setWaitingList((prev) => prev.filter((p) => p.displayName !== participant.displayName));
  };
  const handleReject = (participant) => {
    const socket = getSocket();
    socket.emit("reject-participant", {
      meetingCode,
      displayName: participant.displayName,
      participantIdentity: participant.participantIdentity
    });
    setWaitingList((prev) => prev.filter((p) => p.displayName !== participant.displayName));
  };
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = getSocket();
    socket.emit("send-message", {
      meetingCode,
      message: chatInput.trim(),
      senderName: displayName,
      senderRole: role,
      senderId: user?.id
    });
    setChatInput("");
  };
  const handleLeave = () => {
    if (room) {
      room.disconnect();
    }
    navigate("/dashboard");
  };
  const handleEndForAll = async () => {
    try {
      const socket = getSocket();
      socket.emit("end-meeting-for-all", { meetingCode });
      await api.endMeeting(meetingCode);
    } catch (err) {
      console.warn("End meeting API error:", err);
    } finally {
      if (room) {
        room.disconnect();
      }
      navigate("/dashboard");
    }
  };
  const screenShareTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );
  return <div className="relative h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      <RoomAudioRenderer />

      {
    /* Top Bar */
  }
      <header className="h-14 px-4 sm:px-6 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{meetingTitle}</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            {meetingCode}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{participants.length || 1}</span>
          </div>
        </div>
      </header>

      {
    /* Center Stage: Video Grid + Sidebar */
  }
      <div className="flex-1 flex overflow-hidden relative">
        {
    /* Video Area */
  }
        <div className="flex-1 p-3 sm:p-5 flex flex-col items-center justify-center overflow-y-auto">
          {screenShareTrack ? (
    /* Screen Share Spotlight Layout */
    <div className="w-full h-full flex flex-col gap-3">
              <div className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain" />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                  <MonitorUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>{screenShareTrack.participant.name || "Presenter"}'s Screen</span>
                </div>
              </div>

              {
      /* Strip of cameras below */
    }
              <div className="h-32 flex gap-3 overflow-x-auto justify-center">
                {tracks.filter((t) => isTrackReference(t) && t.source === Track.Source.Camera).map((t) => <div
      key={t.participant.identity}
      className="w-48 h-full bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800 shrink-0"
    >
                      {t.publication?.isMuted ? <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs font-bold">
                          {t.participant.name?.charAt(0).toUpperCase()}
                        </div> : <VideoTrack trackRef={t} className="w-full h-full object-cover -scale-x-100" />}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] truncate max-w-[140px]">
                        {t.participant.name}
                      </div>
                    </div>)}
              </div>
            </div>
  ) : (
    /* Standard Adaptive Video Grid */
    <div
      className={`w-full h-full grid gap-3 sm:gap-4 items-center justify-center ${tracks.length <= 1 ? "grid-cols-1 max-w-4xl max-h-[80vh]" : tracks.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-5xl" : tracks.length <= 4 ? "grid-cols-2 max-w-5xl" : "grid-cols-2 lg:grid-cols-3 max-w-6xl"}`}
    >
              {tracks.length === 0 ? (
      /* Fallback single tile for local user */
      <div className="w-full h-full aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl font-bold mb-3">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-sm text-white">{displayName} (You)</p>
                  <p className="text-xs text-slate-500 mt-1">Connecting media tracks...</p>
                </div>
    ) : tracks.filter((t) => isTrackReference(t)).map((trackRef) => {
      const p = trackRef.participant;
      const isSpeaking = p.isSpeaking;
      const isMuted = trackRef.publication?.isMuted;
      const hasHandRaised = raisedHands[p.identity];
      return <div
        key={p.identity}
        className={`relative w-full h-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-150 flex items-center justify-center shadow-lg ${isSpeaking ? "border-blue-500 shadow-blue-500/30 ring-2 ring-blue-500" : "border-slate-800"}`}
      >
                      {
        /* Video Render */
      }
                      {isMuted ? <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-inner">
                            {p.name?.charAt(0).toUpperCase() || "P"}
                          </div>
                        </div> : <VideoTrack
        trackRef={trackRef}
        className={`w-full h-full object-cover ${p.isLocal ? "-scale-x-100" : ""}`}
      />}

                      {
        /* Name Tag & Audio Status */
      }
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 backdrop-blur rounded-lg text-xs font-semibold text-white border border-slate-800 max-w-[85%]">
                        {p.isSpeaking && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                        <span className="truncate">
                          {p.name} {p.isLocal && "(You)"}
                        </span>
                      </div>

                      {
        /* Hand Raise Badge */
      }
                      {hasHandRaised && <div className="absolute top-2.5 right-2.5 p-1.5 bg-amber-500 text-white rounded-lg shadow-md animate-bounce">
                          <Hand className="w-4 h-4" />
                        </div>}
                    </div>;
    })}
            </div>
  )}
        </div>

        {
    /* Side Drawer (Chat or Participants) */
  }
        {activeDrawer !== "none" && <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl">
            {
    /* Drawer Header */
  }
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {activeDrawer === "chat" ? <>
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>In-Meeting Chat</span>
                  </> : <>
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Participants ({participants.length})</span>
                  </>}
              </div>
              <button
    onClick={() => setActiveDrawer("none")}
    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
  >
                <X className="w-4 h-4" />
              </button>
            </div>

            {
    /* Drawer Content */
  }
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeDrawer === "chat" ? (
    /* Chat Messages */
    <div className="space-y-3">
                  {messages.length === 0 ? <div className="text-center py-12 text-slate-500 text-xs">
                      No messages yet. Send a greeting to participants!
                    </div> : messages.map((m, idx) => <div key={m.id || idx} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-semibold text-white">{m.senderName}</span>
                          {m.senderRole === "host" && <span className="px-1.5 py-0.2 bg-blue-900 text-blue-300 text-[10px] rounded font-bold">
                              Host
                            </span>}
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 bg-slate-800/80 px-3 py-2 rounded-xl rounded-tl-none break-words leading-relaxed border border-slate-700/50">
                          {m.message}
                        </p>
                      </div>)}
                  <div ref={chatBottomRef} />
                </div>
  ) : (
    /* Participants List + Waiting Room */
    <div className="space-y-6">
                  {
      /* Waiting Room Section for Host */
    }
                  {(role === "host" || role === "co-host") && waitingList.length > 0 && <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Waiting Room ({waitingList.length})
                        </span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {waitingList.map((wp) => <div
      key={wp.displayName}
      className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs"
    >
                            <span className="font-semibold text-white truncate max-w-[130px]">
                              {wp.displayName}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
      onClick={() => handleAdmit(wp)}
      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center gap-0.5 transition"
    >
                                <UserCheck className="w-3 h-3" /> Admit
                              </button>
                              <button
      onClick={() => handleReject(wp)}
      className="p-1 text-slate-400 hover:text-red-400 transition"
      title="Reject"
    >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>)}
                      </div>
                    </div>}

                  {
      /* Active Participants */
    }
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      In the Call ({participants.length})
                    </h5>
                    <div className="space-y-1.5">
                      {participants.map((p) => <div
      key={p.identity}
      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition text-xs"
    >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                              {p.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white truncate">
                              {p.name} {p.isLocal && "(You)"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400">
                            {p.isSpeaking && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                            {raisedHands[p.identity] && <Hand className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                        </div>)}
                    </div>
                  </div>
                </div>
  )}
            </div>

            {
    /* Chat Input Field */
  }
            {activeDrawer === "chat" && <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
                <input
    type="text"
    placeholder="Type a message..."
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
  />
                <button
    type="submit"
    disabled={!chatInput.trim()}
    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition"
  >
                  <Send className="w-4 h-4" />
                </button>
              </form>}
          </aside>}
      </div>

      {
    /* Bottom Control Bar */
  }
      <footer className="h-20 bg-slate-900 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between z-20">
        {
    /* Left Info */
  }
        <div className="hidden sm:flex items-center gap-3 w-1/4">
          <span className="text-xs text-slate-400">Meeting ID:</span>
          <span className="text-xs font-mono font-semibold text-slate-200">{meetingCode}</span>
        </div>

        {
    /* Center Media Controls */
  }
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1">
          {
    /* Mic */
  }
          <button
    onClick={toggleMic}
    className={`p-3 rounded-2xl transition shadow-md flex items-center justify-center ${isMicOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
    title={isMicOn ? "Mute Mic" : "Unmute Mic"}
  >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {
    /* Camera */
  }
          <button
    onClick={toggleCamera}
    className={`p-3 rounded-2xl transition shadow-md flex items-center justify-center ${isCameraOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
    title={isCameraOn ? "Turn Off Video" : "Turn On Video"}
  >
            {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {
    /* Screen Share */
  }
          <button
    onClick={toggleScreenShare}
    className={`p-3 rounded-2xl transition shadow-md flex items-center justify-center ${isScreenSharing ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
    title="Share Screen"
  >
            <MonitorUp className="w-5 h-5" />
          </button>

          {
    /* Hand Raise */
  }
          <button
    onClick={toggleHandRaise}
    className={`p-3 rounded-2xl transition shadow-md flex items-center justify-center ${isHandRaised ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
    title="Raise Hand"
  >
            <Hand className="w-5 h-5" />
          </button>

          {
    /* Drawer Toggles */
  }
          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {
    /* Participants Drawer */
  }
          <button
    onClick={() => setActiveDrawer(activeDrawer === "participants" ? "none" : "participants")}
    className={`relative p-3 rounded-2xl transition shadow-md flex items-center justify-center ${activeDrawer === "participants" ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
    title="Participants"
  >
            <Users className="w-5 h-5" />
            {waitingList.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {waitingList.length}
              </span>}
          </button>

          {
    /* Chat Drawer */
  }
          <button
    onClick={() => setActiveDrawer(activeDrawer === "chat" ? "none" : "chat")}
    className={`relative p-3 rounded-2xl transition shadow-md flex items-center justify-center ${activeDrawer === "chat" ? "bg-blue-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
    title="In-Meeting Chat"
  >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>}
          </button>
        </div>

        {
    /* Right End Call Button */
  }
        <div className="flex items-center justify-end w-1/4">
          {role === "host" ? <button
    onClick={() => setEndModalOpen(true)}
    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/20 transition flex items-center gap-1.5"
  >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">End Meeting</span>
            </button> : <button
    onClick={handleLeave}
    className="px-4 py-2.5 bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5"
  >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>}
        </div>
      </footer>

      {
    /* Host End Meeting Confirmation Modal */
  }
      {endModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950 text-red-500 border border-red-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Leave or End Meeting?</h3>
            <p className="text-xs text-slate-400">
              As the host, you can end the meeting for all participants (generating the final attendance report) or
              leave temporarily.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
    onClick={handleEndForAll}
    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
  >
                End Meeting for All
              </button>
              <button
    onClick={handleLeave}
    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
  >
                Leave Meeting Just for Me
              </button>
              <button
    onClick={() => setEndModalOpen(false)}
    className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
  >
                Cancel
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
const MeetingRoomPage = () => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const [token, setToken] = useState(state?.token || "");
  const [livekitUrl, setLivekitUrl] = useState(state?.livekitUrl || "ws://localhost:7880");
  const [displayName, setDisplayName] = useState(state?.displayName || "Participant");
  const [role, setRole] = useState(state?.role || "participant");
  const [meetingTitle, setMeetingTitle] = useState(state?.meeting?.title || `Meeting ${code}`);
  const [loading, setLoading] = useState(!state?.token);
  useEffect(() => {
    if (!state?.token && code) {
      api.joinMeeting(code, { displayName: "Guest Participant" }).then((res) => {
        if (res.token) {
          setToken(res.token);
          setLivekitUrl(res.livekitUrl || "ws://localhost:7880");
          setDisplayName(res.displayName || "Guest Participant");
          setRole(res.role || "participant");
          if (res.meeting?.title) setMeetingTitle(res.meeting.title);
        } else if (res.inWaitingRoom) {
          navigate(`/waiting-room/${code}`);
        }
      }).catch(() => {
        navigate(`/meeting/${code}`);
      }).finally(() => setLoading(false));
    }
  }, [code, state, navigate]);
  if (loading || !token) {
    return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Connecting to secure media service...</p>
        </div>
      </div>;
  }
  return <LiveKitRoom
    serverUrl={livekitUrl}
    token={token}
    connect={true}
    video={state?.initialVideo ?? true}
    audio={state?.initialAudio ?? true}
    data-lk-theme="default"
  >
      <RoomContent
    meetingCode={code || "room"}
    displayName={displayName}
    role={role}
    meetingTitle={meetingTitle}
  />
    </LiveKitRoom>;
};
export {
  MeetingRoomPage
};
