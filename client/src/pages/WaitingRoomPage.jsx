import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, X, AlertCircle } from "lucide-react";
import { getSocket } from "../services/socket.js";
import { useAuth } from "../context/AuthContext.js";
const WaitingRoomPage = () => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state;
  const displayName = state?.displayName || user?.name || "Guest Participant";
  const meetingTitle = state?.meeting?.title || "Meeting";
  const participantIdentity =
    state?.participantIdentity ||
    state?.participantId ||
    (user?.id ? `user-${user.id}` : `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const [rejectedMessage, setRejectedMessage] = useState(null);
  useEffect(() => {
    if (!code) return;
    const socket = getSocket();
    socket.emit("join-waiting-room", {
      meetingCode: code,
      displayName,
      participantIdentity,
      userId: user?.id
    });
    const handleAdmitted = (data) => {
      if (!data.participantIdentity || data.participantIdentity === participantIdentity) {
        navigate(`/room/${code}`, {
          state: {
            token: data.token,
            livekitUrl: data.livekitUrl,
            displayName,
            role: "participant",
            meeting: data.meeting || state?.meeting
          },
          replace: true
        });
      }
    };
    const handleRejected = (data) => {
      if (!data.participantIdentity || data.participantIdentity === participantIdentity) {
        setRejectedMessage(data.message || "The host has denied your request to join.");
      }
    };
    socket.on("admitted", handleAdmitted);
    socket.on("rejected", handleRejected);
    return () => {
      socket.off("admitted", handleAdmitted);
      socket.off("rejected", handleRejected);
    };
  }, [code, displayName, participantIdentity, navigate, state, user]);
  return <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {
    /* Pulsing ring background indicator */
  }
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {rejectedMessage ? <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Admission Denied</h3>
            <p className="text-sm text-slate-400">{rejectedMessage}</p>
            <Link
    to="/dashboard"
    className="inline-block mt-4 px-6 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
  >
              Return to Dashboard
            </Link>
          </div> : <div className="space-y-6 relative z-10">
            {
    /* Animated Radar Icon */
  }
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-600/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </div>

            <div>
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded-full inline-block mb-2">
                Waiting Room
              </span>
              <h2 className="text-2xl font-extrabold text-white">{meetingTitle}</h2>
              <p className="text-xs text-slate-400 mt-2">
                Please wait, the meeting host will let you in shortly.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Connecting as</span>
                <span className="font-semibold text-white">{displayName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Meeting Code</span>
                <span className="font-mono text-blue-400 font-semibold">{code}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time signaling connected</span>
            </div>

            <Link
    to="/dashboard"
    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
  >
              <X className="w-3.5 h-3.5" />
              <span>Leave Waiting Room</span>
            </Link>
          </div>}
      </div>
    </div>;
};
export {
  WaitingRoomPage
};
