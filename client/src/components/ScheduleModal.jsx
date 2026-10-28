import { useState } from "react";
import { Calendar, Clock, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "./Modal.js";
import { api } from "../services/api.js";
const ScheduleModal = ({ isOpen, onClose, onScheduled }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const d = /* @__PURE__ */ new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(30);
  const [passcode, setPasscode] = useState("");
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a meeting title");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.createMeeting({
        title: title.trim(),
        description: description.trim(),
        isInstant: false,
        scheduledStartTime: new Date(date).toISOString(),
        scheduledDuration: Number(duration),
        passcode: passcode.trim() || void 0,
        isWaitingRoomEnabled,
        chatEnabled
      });
      if (res.success && res.meeting) {
        onScheduled(res.meeting);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Schedule a Meeting"
    description="Plan ahead and invite your teammates with automated calendar events."
  >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title *</label>
          <input
    type="text"
    required
    placeholder="e.g. Weekly Product Sync"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
          <textarea
    rows={2}
    placeholder="Agenda, objectives, or notes for participants..."
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Start Date & Time
            </label>
            <input
    type="datetime-local"
    required
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Duration (Minutes)
            </label>
            <select
    value={duration}
    onChange={(e) => setDuration(Number(e.target.value))}
    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> Passcode (Optional)
          </label>
          <input
    type="text"
    placeholder="Require code to enter (leave blank for open access)"
    value={passcode}
    onChange={(e) => setPasscode(e.target.value)}
    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
    type="checkbox"
    checked={isWaitingRoomEnabled}
    onChange={(e) => setIsWaitingRoomEnabled(e.target.checked)}
    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
  />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Enable Waiting Room
              </span>
              <p className="text-slate-500">Host manually admits participants before they enter</p>
            </div>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
    type="checkbox"
    checked={chatEnabled}
    onChange={(e) => setChatEnabled(e.target.checked)}
    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
  />
            <div className="text-xs">
              <span className="font-semibold text-slate-800">Enable In-Meeting Chat</span>
              <p className="text-slate-500">Participants can send real-time text messages</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-3">
          <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
  >
            Cancel
          </button>
          <button
    type="submit"
    disabled={loading}
    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition"
  >
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </form>
    </Modal>;
};
export {
  ScheduleModal
};
