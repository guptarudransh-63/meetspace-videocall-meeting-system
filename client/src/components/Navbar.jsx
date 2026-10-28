import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video, Calendar, LogOut, User as UserIcon, Plus, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
const Navbar = ({
  onNewMeeting,
  onSchedule
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quickCode, setQuickCode] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    const cleanCode = quickCode.trim().replace(/^.*\/meeting\//, "");
    navigate(`/meeting/${cleanCode}`);
  };
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  return <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {
    /* Brand */
  }
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-900">
            Meet<span className="text-blue-600">Space</span>
          </span>
        </Link>

        {
    /* Quick Join Bar */
  }
        <form onSubmit={handleQuickJoin} className="hidden md:flex items-center gap-2">
          <input
    type="text"
    placeholder="Enter meeting code (e.g. abc-defg-hij)"
    value={quickCode}
    onChange={(e) => setQuickCode(e.target.value)}
    className="w-72 px-3.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
  />
          <button
    type="submit"
    className="px-3.5 py-1.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
  >
            Join
          </button>
        </form>

        {
    /* Navigation & User actions */
  }
        <div className="flex items-center gap-3">
          {user ? <>
              {onNewMeeting && <button
    onClick={onNewMeeting}
    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition"
  >
                  <Plus className="w-4 h-4" />
                  <span>New Meeting</span>
                </button>}

              <Link
    to="/dashboard"
    className="hidden lg:inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
  >
                Dashboard
              </Link>

              {
    /* User Dropdown */
  }
              <div className="relative">
                <button
    onClick={() => setUserMenuOpen(!userMenuOpen)}
    className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition border border-slate-200"
  >
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>}
                  <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
    to="/dashboard"
    onClick={() => setUserMenuOpen(false)}
    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
  >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Meetings Dashboard
                    </Link>
                    <Link
    to="/profile"
    onClick={() => setUserMenuOpen(false)}
    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
  >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Profile & Settings
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
    onClick={handleLogout}
    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left transition"
  >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>}
              </div>
            </> : <div className="flex items-center gap-2">
              <Link
    to="/login"
    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
  >
                Sign In
              </Link>
              <Link
    to="/register"
    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition"
  >
                Get Started
              </Link>
            </div>}
        </div>
      </div>
    </header>;
};
export {
  Navbar
};
