import { Link } from "react-router-dom";
import { Video, Home } from "lucide-react";
const NotFoundPage = () => {
  return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
        <Video className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <p className="text-sm font-semibold text-slate-600 mt-2">Page or Meeting Not Found</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The meeting URL or page you requested does not exist or may have been deleted.
      </p>
      <Link
    to="/dashboard"
    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
  >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>;
};
export {
  NotFoundPage
};
