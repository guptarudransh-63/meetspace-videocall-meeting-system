import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Lock,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.js";
const PreJoinPage = () => {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  useEffect(() => {
    const fetchMeeting = async () => {
      if (!code) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.getMeetingByCode(code);
        if (res.success) {
          setMeeting(res.meeting);
        }
      } catch (err) {
        setError(err.message || "Meeting not found or has ended");
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [code]);
  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.name);
    }
  }, [user]);
  const startLocalMedia = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const constraints = {
        video: isCameraOn ? selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true : false,
        audio: isMicOn ? selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current && isCameraOn) {
        videoRef.current.srcObject = stream;
      }
      setMediaPermissionDenied(false);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      if (isMicOn && stream.getAudioTracks().length > 0) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.floor(avg / 128 * 100)));
          animationFrameRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
      }
    } catch (err) {
      console.warn("Could not access camera/mic preview:", err);
      setMediaPermissionDenied(true);
    }
  };
  useEffect(() => {
    startLocalMedia();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
        });
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraOn, isMicOn, selectedVideoDevice, selectedAudioDevice]);
  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };
  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code) return;
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }
    try {
      setJoining(true);
      setError("");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const res = await api.joinMeeting(code, {
        displayName: displayName.trim(),
        passcode: passcode.trim() || void 0
      });
      if (res.inWaitingRoom) {
        navigate(`/waiting-room/${code}`, {
          state: {
            meeting: res.meeting || meeting,
            displayName: displayName.trim(),
            participantIdentity: res.participantIdentity,
            participantId: res.participantId || res.participantIdentity
          }
        });
      } else if (res.token) {
        navigate(`/room/${code}`, {
          state: {
            token: res.token,
            livekitUrl: res.livekitUrl,
            role: res.role,
            displayName: res.displayName || displayName.trim(),
            meeting: res.meeting || meeting,
            initialAudio: isMicOn,
            initialVideo: isCameraOn
          }
        });
      }
    } catch (err) {
      setError(err.message || "Failed to join meeting");
    } finally {
      setJoining(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading meeting details...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {
    /* Top Header */
  }
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-90 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Video className="w-4 h-4" />
          </div>
          <span>
            Meet<span className="text-blue-500">Space</span>
          </span>
        </Link>

        <Link
    to="/dashboard"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
  >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Dashboard</span>
        </Link>
      </header>

      {
    /* Main Container */
  }
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10">
        {
    /* Left: Video Preview Tile */
  }
        <div className="w-full lg:w-3/5 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {isCameraOn && !mediaPermissionDenied ? <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className="w-full h-full object-cover -scale-x-100"
  /> : <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <VideoOff className="w-8 h-8" />
                </div>
                <p className="text-xs font-medium">Camera is turned off</p>
              </div>}

            {
    /* Audio Live Level Bar */
  }
            {isMicOn && <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 backdrop-blur rounded-full text-xs border border-slate-800">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
    className="h-full bg-emerald-400 transition-all duration-75"
    style={{ width: `${audioLevel}%` }}
  />
                </div>
              </div>}

            {
    /* Control Overlays */
  }
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
    type="button"
    onClick={toggleMic}
    className={`p-3 rounded-full shadow-md backdrop-blur transition ${isMicOn ? "bg-slate-800/80 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
    title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
  >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
    type="button"
    onClick={toggleCamera}
    className={`p-3 rounded-full shadow-md backdrop-blur transition ${isCameraOn ? "bg-slate-800/80 hover:bg-slate-700 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
    title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
  >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {
    /* Device Selectors */
  }
          <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            {videoDevices.length > 0 && <div>
                <label className="block mb-1 font-semibold text-slate-300">Camera Device</label>
                <select
    value={selectedVideoDevice}
    onChange={(e) => setSelectedVideoDevice(e.target.value)}
    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
  >
                  {videoDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>)}
                </select>
              </div>}

            {audioDevices.length > 0 && <div>
                <label className="block mb-1 font-semibold text-slate-300">Microphone Device</label>
                <select
    value={selectedAudioDevice}
    onChange={(e) => setSelectedAudioDevice(e.target.value)}
    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
  >
                  {audioDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId.slice(0, 5)}`}
                    </option>)}
                </select>
              </div>}
          </div>
        </div>

        {
    /* Right: Join Configuration Panel */
  }
        <div className="w-full lg:w-2/5 max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
          <div className="mb-6">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800 rounded-full inline-block mb-2">
              Ready to Connect
            </span>
            <h2 className="text-xl font-bold text-white truncate">{meeting?.title || "Meeting"}</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Code: {code}</p>
          </div>

          {error && <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name</label>
              <input
    type="text"
    required
    value={displayName}
    onChange={(e) => setDisplayName(e.target.value)}
    placeholder="How will you appear to others?"
    className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
  />
            </div>

            {meeting?.requiresPasscode && <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Meeting Passcode
                </label>
                <input
    type="password"
    required
    value={passcode}
    onChange={(e) => setPasscode(e.target.value)}
    placeholder="Enter passcode from host"
    className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
  />
              </div>}

            {meeting?.isWaitingRoomEnabled && <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  Waiting room is enabled. When you click Join, the host will be notified to admit you.
                </p>
              </div>}

            <button
    type="submit"
    disabled={joining || !displayName.trim()}
    className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
  >
              <span>{joining ? "Connecting..." : "Join Meeting"}</span>
              {!joining && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>
    </div>;
};
export {
  PreJoinPage
};
