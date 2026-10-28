import { useState } from "react";
import { User, Lock, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../services/api.js";
import { Navbar } from "../components/Navbar.js";
const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileSuccess("");
      setProfileError("");
      const res = await api.updateProfile({ name, timezone, avatarUrl });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileSuccess("Profile updated successfully");
      }
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setPasswordSaving(true);
      setPasswordSuccess("");
      setPasswordError("");
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <Link
    to="/dashboard"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
  >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your identity, preferences, and security credentials.</p>
        </div>

        {
    /* Profile Card */
  }
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Profile Details</span>
          </h2>

          {profileSuccess && <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl">
              <Check className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>}

          {profileError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
  />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
    type="email"
    disabled
    value={user?.email || ""}
    className="w-full px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
  />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                <input
    type="text"
    value={timezone}
    onChange={(e) => setTimezone(e.target.value)}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
  />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL (Optional)</label>
                <input
    type="url"
    placeholder="https://..."
    value={avatarUrl}
    onChange={(e) => setAvatarUrl(e.target.value)}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
  />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
    type="submit"
    disabled={profileSaving}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
  >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {
    /* Change Password Card */
  }
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Change Password</span>
          </h2>

          {passwordSuccess && <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl">
              <Check className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>}

          {passwordError && <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
    type="password"
    required
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
  />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
    type="password"
    required
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    placeholder="At least 6 characters"
    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
  />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
    type="submit"
    disabled={passwordSaving}
    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
  >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>;
};
export {
  ProfilePage
};
