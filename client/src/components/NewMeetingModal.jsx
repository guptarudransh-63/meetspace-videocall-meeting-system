import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "./Modal.js";
import { api } from "../services/api.js";
const NewMeetingModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Instant Meeting");
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleStartInstant = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.createMeeting({
        title: title.trim() || "Instant Meeting",
        isInstant: true,
        isWaitingRoomEnabled,
        passcode: passcode.trim() || void 0
      });
      if (res.success && res.meeting) {
        onClose();
        navigate(`/meeting/${res.meeting.meetingCode}`);
      }
    } catch (err) {
      setError(err.message || "Failed to start meeting");
    } finally {
      setLoading(false);
    }
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Start a New Meeting"
    description="Launch an instant call or configure permissions before joining."
  >
      <div className="space-y-4">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Name</label>
          <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" /> Optional Passcode
          </label>
          <input
    type="text"
    placeholder="Leave empty for open access"
    value={passcode}
    onChange={(e) => setPasscode(e.target.value)}
    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
        </div>

        <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
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
            <p className="text-slate-500">Require guests to be admitted by you before entering</p>
          </div>
        </label>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
  >
            Cancel
          </button>
          <button
    type="button"
    onClick={handleStartInstant}
    disabled={loading}
    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition"
  >
            <Video className="w-4 h-4" />
            <span>{loading ? "Creating..." : "Start Now"}</span>
          </button>
        </div>
      </div>
    </Modal>;
};
export {
  NewMeetingModal
};
