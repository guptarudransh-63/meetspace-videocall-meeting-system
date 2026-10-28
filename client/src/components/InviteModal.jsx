import { useState } from "react";
import { Copy, Check, Mail, Download, Share2, AlertCircle } from "lucide-react";
import { Modal } from "./Modal.js";
import { api } from "../services/api.js";
const InviteModal = ({ isOpen, onClose, meeting }) => {
  const [emailsInput, setEmailsInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  if (!meeting) return null;
  const joinUrl = `${window.location.origin}/meeting/${meeting.meetingCode}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const handleSendInvites = async (e) => {
    e.preventDefault();
    const emails = emailsInput.split(/[\s,;]+/).map((e2) => e2.trim()).filter((e2) => e2 && e2.includes("@"));
    if (emails.length === 0) {
      setError("Please enter at least one valid email address");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.sendInvitations(meeting._id || meeting.id, emails);
      if (res.success) {
        setSuccessMsg(`Invitations saved for ${emails.length} recipient(s)`);
        setEmailsInput("");
      }
    } catch (err) {
      setError(err.message || "Failed to send invitations");
    } finally {
      setLoading(false);
    }
  };
  return <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Invite People"
    description={`Share the link or invite teammates to "${meeting.title}"`}
  >
      <div className="space-y-4">
        {
    /* Shareable Link Box */
  }
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-blue-600" /> Meeting Invitation Link
          </label>
          <div className="flex items-center gap-2">
            <input
    type="text"
    readOnly
    value={joinUrl}
    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none select-all"
  />
            <button
    onClick={handleCopyLink}
    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${copied ? "bg-emerald-600 text-white shadow-sm" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"}`}
  >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {
    /* Calendar ICS Export */
  }
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-800">Add to Calendar (.ICS)</p>
            <p className="text-[11px] text-slate-500">Works with Google Calendar, Apple, Outlook</p>
          </div>
          <a
    href={api.getIcsDownloadUrl(meeting._id || meeting.id)}
    download
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm transition"
  >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ics</span>
          </a>
        </div>

        {
    /* Invite by Email */
  }
        <form onSubmit={handleSendInvites} className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> Invite by Email
            </label>
            <textarea
    rows={2}
    placeholder="team@example.com, colleague@company.org"
    value={emailsInput}
    onChange={(e) => setEmailsInput(e.target.value)}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
          </div>

          {error && <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>}

          {successMsg && <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>}

          <div className="flex justify-end gap-2">
            <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
  >
              Done
            </button>
            <button
    type="submit"
    disabled={loading || !emailsInput.trim()}
    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
  >
              {loading ? "Sending..." : "Send Invitations"}
            </button>
          </div>
        </form>
      </div>
    </Modal>;
};
export {
  InviteModal
};
