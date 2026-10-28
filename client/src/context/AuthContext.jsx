import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api.js";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch {
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);
  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      setUser(res.user);
    }
  };
  const register = async (name, email, password, timezone) => {
    const res = await api.register({ name, email, password, timezone });
    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      setUser(res.user);
    }
  };
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };
  const updateUser = (updated) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export {
  AuthProvider,
  useAuth
};
