import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Share2,
  Trash2,
  FileSpreadsheet,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Copy
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../services/api.js";
import { Navbar } from "../components/Navbar.js";
import { NewMeetingModal } from "../components/NewMeetingModal.js";
import { ScheduleModal } from "../components/ScheduleModal.js";
import { InviteModal } from "../components/InviteModal.js";
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [newMeetingModalOpen, setNewMeetingModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedMeetingForInvite, setSelectedMeetingForInvite] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["meetings", activeTab, search],
    queryFn: () => api.listMeetings({ type: activeTab, search }),
    refetchInterval: 15e3
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    }
  });
  const handleCopyLink = (meeting) => {
    const url = `${window.location.origin}/meeting/${meeting.meetingCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(meeting.meetingCode);
    setTimeout(() => setCopiedCode(null), 2e3);
  };
  const handleManualJoin = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const clean = joinCodeInput.trim().replace(/^.*\/meeting\//, "");
    navigate(`/meeting/${clean}`);
  };
  const meetings = data?.meetings || [];
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
    onNewMeeting={() => setNewMeetingModalOpen(true)}
    onSchedule={() => setScheduleModalOpen(true)}
  />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {
    /* Welcome Banner */
  }
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name.split(" ")[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Timezone: <span className="font-semibold text-slate-700">{user?.timezone || "UTC"}</span> • Manage and
              launch secure meetings with real-time analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
    onClick={() => setNewMeetingModalOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition"
  >
              <Video className="w-4 h-4" />
              <span>New Meeting</span>
            </button>
            <button
    onClick={() => setScheduleModalOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 rounded-xl shadow-sm transition"
  >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Schedule</span>
            </button>
          </div>
        </div>

        {
    /* Quick Action Tiles */
  }
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
    onClick={() => setNewMeetingModalOpen(true)}
    className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer hover:scale-[1.02] transition"
  >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-base">Instant Meeting</h3>
            <p className="text-xs text-blue-100 mt-1">Start a room and share the link immediately</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Join Meeting</h3>
            <form onSubmit={handleManualJoin} className="mt-2 flex gap-1.5">
              <input
    type="text"
    placeholder="Code (abc-defg-hij)"
    value={joinCodeInput}
    onChange={(e) => setJoinCodeInput(e.target.value)}
    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
  />
              <button
    type="submit"
    className="px-2.5 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
  >
                Go
              </button>
            </form>
          </div>

          <div
    onClick={() => setScheduleModalOpen(true)}
    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs cursor-pointer hover:border-blue-300 transition"
  >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Schedule Ahead</h3>
            <p className="text-xs text-slate-500 mt-1">Calendar invitations & timezone sync</p>
          </div>

          <div
    onClick={() => setActiveTab("past")}
    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs cursor-pointer hover:border-emerald-300 transition"
  >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Attendance Reports</h3>
            <p className="text-xs text-slate-500 mt-1">Audit attendee durations & export CSV</p>
          </div>
        </div>

        {
    /* Tab Controls & Search Bar */
  }
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
    onClick={() => setActiveTab("upcoming")}
    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${activeTab === "upcoming" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
  >
              Upcoming & Active
            </button>
            <button
    onClick={() => setActiveTab("past")}
    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${activeTab === "past" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
  >
              Past & Ended
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
    type="text"
    placeholder="Search meetings..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
          </div>
        </div>

        {
    /* Meeting Cards List */
  }
        <div className="mt-6 space-y-3">
          {isLoading ? <div className="text-center py-12 text-slate-400 text-xs">Loading meetings...</div> : meetings.length === 0 ? <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No {activeTab} meetings found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === "upcoming" ? "You have no scheduled calls. Create an instant meeting or schedule one for later." : "Completed meetings with attendance records will appear here."}
              </p>
              {activeTab === "upcoming" && <button
    onClick={() => setScheduleModalOpen(true)}
    className="mt-4 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
  >
                  Schedule a Meeting
                </button>}
            </div> : meetings.map((meeting) => {
    const isPast = activeTab === "past" || meeting.status === "ended";
    const meetingDate = meeting.scheduledStartTime ? format(parseISO(meeting.scheduledStartTime), "EEE, MMM d, yyyy \u2022 h:mm a") : "Instant Session";
    return <div
      key={meeting._id || meeting.id}
      className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
    >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{meeting.title}</h4>
                      <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${meeting.status === "active" ? "bg-emerald-100 text-emerald-800 animate-pulse" : meeting.status === "scheduled" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
    >
                        {meeting.status}
                      </span>
                      {meeting.isWaitingRoomEnabled && <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Waiting Room
                        </span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {meetingDate}
                      </span>
                      <span>•</span>
                      <span>{meeting.scheduledDuration} min</span>
                      <span>•</span>
                      <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {meeting.meetingCode}
                      </span>
                    </div>

                    {meeting.description && <p className="text-xs text-slate-500 line-clamp-1">{meeting.description}</p>}
                  </div>

                  {
      /* Actions */
    }
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {!isPast ? <>
                        <button
      onClick={() => handleCopyLink(meeting)}
      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1"
      title="Copy Invitation Link"
    >
                          {copiedCode === meeting.meetingCode ? <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </> : <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>}
                        </button>

                        <button
      onClick={() => setSelectedMeetingForInvite(meeting)}
      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1"
      title="Invite Participants"
    >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>

                        <button
      onClick={() => navigate(`/meeting/${meeting.meetingCode}`)}
      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
    >
                          <span>Join</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
      onClick={() => deleteMutation.mutate(meeting._id || meeting.id)}
      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
      title="Cancel Meeting"
    >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </> : <button
      onClick={() => navigate(`/reports/${meeting._id || meeting.id}`)}
      className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-xl transition flex items-center gap-2"
    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>View Attendance Report</span>
                      </button>}
                  </div>
                </div>;
  })}
        </div>
      </main>

      {
    /* Modals */
  }
      <NewMeetingModal isOpen={newMeetingModalOpen} onClose={() => setNewMeetingModalOpen(false)} />
      <ScheduleModal
    isOpen={scheduleModalOpen}
    onClose={() => setScheduleModalOpen(false)}
    onScheduled={() => queryClient.invalidateQueries({ queryKey: ["meetings"] })}
  />
      <InviteModal
    isOpen={!!selectedMeetingForInvite}
    onClose={() => setSelectedMeetingForInvite(null)}
    meeting={selectedMeetingForInvite}
  />
    </div>;
};
export {
  DashboardPage
};
