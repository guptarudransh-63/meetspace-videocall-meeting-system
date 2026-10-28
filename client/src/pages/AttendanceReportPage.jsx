import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileSpreadsheet,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  ArrowDownToLine
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { api } from "../services/api.js";
import { Navbar } from "../components/Navbar.js";
const AttendanceReportPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.getAttendanceReport(id);
        if (res.success) {
          setReport(res.report);
        }
      } catch (err) {
        setError(err.message || "Failed to load attendance report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);
  const csvDownloadUrl = id ? api.getAttendanceCsvUrl(id) : "";
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {
    /* Top Breadcrumb */
  }
        <div className="mb-6 flex items-center justify-between">
          <Link
    to="/dashboard"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
  >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {id && <a
    href={csvDownloadUrl}
    download
    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition"
  >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Export CSV Report</span>
            </a>}
        </div>

        {loading ? <div className="text-center py-20 text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading attendance records...
          </div> : error ? <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm max-w-lg mx-auto text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <h4 className="font-bold">Attendance Report Error</h4>
            <p className="text-xs">{error}</p>
            <Link
    to="/dashboard"
    className="inline-block mt-2 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition"
  >
              Return to Dashboard
            </Link>
          </div> : !report ? <div className="text-center py-12 text-slate-500 text-xs">No attendance records found.</div> : <div className="space-y-6">
            {
    /* Header Card */
  }
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Official Attendance Audit</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {report.meeting.title}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Meeting Code:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {report.meeting.meetingCode}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Unique Attendees</span>
                    <span className="text-xl font-extrabold text-slate-900">
                      {report.totalUniqueParticipants}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Total Sessions</span>
                    <span className="text-xl font-extrabold text-slate-900">{report.totalSessions}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Status</span>
                    <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                      {report.meeting.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {
    /* Attendance Table */
  }
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Participant Attendance Breakdown</h3>
                <span className="text-xs text-slate-500">
                  {report.participants.length} attendee(s) recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Attendee</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">First Joined</th>
                      <th className="px-6 py-3">Last Left</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Sessions</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.participants.map((p) => {
    const mins = (p.totalDurationSeconds / 60).toFixed(1);
    const firstJoinedFormatted = p.firstJoined ? format(parseISO(p.firstJoined), "h:mm:ss a") : "\u2014";
    const lastLeftFormatted = p.lastLeft ? format(parseISO(p.lastLeft), "h:mm:ss a") : "In progress";
    return <tr key={p.identity} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {p.displayName.charAt(0).toUpperCase()}
                              </div>
                              <span>{p.displayName}</span>
                            </div>
                          </td>

                          <td className="px-6 py-3.5 text-slate-600 font-medium">
                            {p.email || <span className="text-slate-400 italic">Guest</span>}
                          </td>

                          <td className="px-6 py-3.5 text-slate-600">{firstJoinedFormatted}</td>

                          <td className="px-6 py-3.5 text-slate-600">{lastLeftFormatted}</td>

                          <td className="px-6 py-3.5 font-bold text-slate-900">
                            {mins} min{" "}
                            <span className="text-slate-400 font-normal">
                              ({p.totalDurationSeconds}s)
                            </span>
                          </td>

                          <td className="px-6 py-3.5 text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 rounded font-semibold">
                              {p.sessionsCount} session(s)
                            </span>
                          </td>

                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Recorded
                            </span>
                          </td>
                        </tr>;
  })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}
      </main>
    </div>;
};
export {
  AttendanceReportPage
};
