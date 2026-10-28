import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { LandingPage } from "./pages/LandingPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { PreJoinPage } from "./pages/PreJoinPage.js";
import { WaitingRoomPage } from "./pages/WaitingRoomPage.js";
import { MeetingRoomPage } from "./pages/MeetingRoomPage.js";
import { AttendanceReportPage } from "./pages/AttendanceReportPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5e3,
      retry: 1
    }
  }
});
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
function App() {
  return <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {
    /* Authenticated Dashboard & Reports */
  }
            <Route
    path="/dashboard"
    element={<ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>}
  />
            <Route
    path="/reports/:id"
    element={<ProtectedRoute>
                  <AttendanceReportPage />
                </ProtectedRoute>}
  />
            <Route
    path="/profile"
    element={<ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>}
  />

            {
    /* Public / Guest Pre-join, Waiting Room & Meeting Call */
  }
            <Route path="/meeting/:code" element={<PreJoinPage />} />
            <Route path="/waiting-room/:code" element={<WaitingRoomPage />} />
            <Route path="/room/:code" element={<MeetingRoomPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>;
}
var stdin_default = App;
export {
  App,
  stdin_default as default
};
