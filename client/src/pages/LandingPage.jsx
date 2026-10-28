import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Video,
  Calendar,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  MonitorUp,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { Navbar } from "../components/Navbar.js";
import { NewMeetingModal } from "../components/NewMeetingModal.js";
import { ScheduleModal } from "../components/ScheduleModal.js";
const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [newMeetingModalOpen, setNewMeetingModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const handleJoin = (e) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    const clean = meetingCode.trim().replace(/^.*\/meeting\//, "");
    navigate(`/meeting/${clean}`);
  };
  const handleQuickDemoLogin = async (email) => {
    try {
      setDemoLoading(true);
      await login(email, "password123");
      navigate("/dashboard");
    } catch (err) {
      console.error("Demo login failed:", err);
    } finally {
      setDemoLoading(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
    onNewMeeting={() => user ? setNewMeetingModalOpen(true) : navigate("/login")}
    onSchedule={() => user ? setScheduleModalOpen(true) : navigate("/login")}
  />

      {
    /* Hero Section */
  }
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise-Grade WebRTC & Live Collaboration</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Video meetings for high-velocity teams,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              built with precision.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Experience crystal-clear real-time communication, intelligent waiting rooms, active speaker tracking, and
            accurate attendance auditing built on LiveKit SFU.
          </p>

          {
    /* Action Area */
  }
          <div className="mt-10 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? <button
    onClick={() => setNewMeetingModalOpen(true)}
    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
  >
                <Video className="w-4 h-4" />
                <span>Start Instant Meeting</span>
              </button> : <Link
    to="/register"
    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
  >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>}

            {
    /* Quick Join Code Form */
  }
            <form onSubmit={handleJoin} className="w-full sm:w-auto flex items-center gap-2">
              <input
    type="text"
    placeholder="Enter meeting code"
    value={meetingCode}
    onChange={(e) => setMeetingCode(e.target.value)}
    className="w-full sm:w-56 px-4 py-3.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
              <button
    type="submit"
    className="px-5 py-3.5 text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm transition"
  >
                Join
              </button>
            </form>
          </div>

          {
    /* Demo Login Quick Access Chips */
  }
          <div className="mt-8 pt-6 border-t border-slate-200/80 max-w-lg mx-auto flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Quick Demo Access:</span>
            <button
    onClick={() => handleQuickDemoLogin("host@meetspace.dev")}
    disabled={demoLoading}
    className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded-lg shadow-xs transition"
  >
              Sign in as Host
            </button>
            <button
    onClick={() => handleQuickDemoLogin("alex@meetspace.dev")}
    disabled={demoLoading}
    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg shadow-xs transition"
  >
              Sign in as Participant
            </button>
          </div>
        </div>
      </section>

      {
    /* Feature Grid */
  }
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Engineered for seamless collaboration
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything teams need to meet, coordinate, and review sessions with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">LiveKit SFU Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adaptive video routing with simulcast, active speaker auto-detection, and low latency browser-to-browser
                communication.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Waiting Rooms & Moderation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Host-controlled admissions, permission locks, participant muting, and strict backend token authorization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Attendance Auditing & CSV</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tracks join and leave timestamps, multi-session reconnects, total active minutes, and exports clean CSV
                reports.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Scheduling & .ICS Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Timezone-aware scheduling with automated calendar invitation files compatible with Google, Apple, and Outlook.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <MonitorUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Screen Sharing & Spotlight</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Share application windows, browser tabs, or full displays with automatic presenter spotlighting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Persistent Meeting Chat</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time Socket.IO messaging stored securely in MongoDB with role badges and system event tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {
    /* Footer */
  }
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 MeetSpace. Enterprise video conferencing platform.</p>
          <div className="flex items-center gap-4">
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-white transition">
              Swagger OpenAPI Docs
            </a>
            <span>•</span>
            <span className="text-slate-300">LiveKit SFU + Socket.IO + MERN</span>
          </div>
        </div>
      </footer>

      {
    /* Modals */
  }
      <NewMeetingModal isOpen={newMeetingModalOpen} onClose={() => setNewMeetingModalOpen(false)} />
      <ScheduleModal
    isOpen={scheduleModalOpen}
    onClose={() => setScheduleModalOpen(false)}
    onScheduled={(m) => navigate(`/dashboard`)}
  />
    </div>;
};
export {
  LandingPage
};
