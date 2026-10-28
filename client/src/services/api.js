const API_BASE = "/api/v1";
class ApiError extends Error {
  statusCode;
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
const getHeaders = (hasBody = true) => {
  const headers = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};
const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = "An error occurred";
    try {
      const data = await res.json();
      errorMsg = data.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new ApiError(errorMsg, res.status);
  }
  return res.json();
};
const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: getHeaders(false),
      credentials: "include"
    });
    localStorage.removeItem("token");
    return handleResponse(res);
  },
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async updateProfile(data) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async changePassword(data) {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  // Meetings
  async createMeeting(data) {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async listMeetings(params) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/meetings?${query}`, {
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async getMeetingByCode(code) {
    const res = await fetch(`${API_BASE}/meetings/${code}`, {
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async updateMeeting(id, data) {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async deleteMeeting(id) {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: "DELETE",
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async joinMeeting(code, data) {
    const res = await fetch(`${API_BASE}/meetings/${code}/join`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async endMeeting(code) {
    const res = await fetch(`${API_BASE}/meetings/${code}/end`, {
      method: "POST",
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  async getChatHistory(code) {
    const res = await fetch(`${API_BASE}/meetings/${code}/messages`, {
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  // Invitations
  async sendInvitations(meetingId, emails) {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/invite`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ emails }),
      credentials: "include"
    });
    return handleResponse(res);
  },
  // Attendance & CSV Export
  async getAttendanceReport(meetingId) {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/attendance`, {
      headers: getHeaders(false),
      credentials: "include"
    });
    return handleResponse(res);
  },
  getAttendanceCsvUrl(meetingId) {
    return `${API_BASE}/meetings/${meetingId}/attendance/csv`;
  },
  getIcsDownloadUrl(meetingId) {
    return `${API_BASE}/meetings/${meetingId}/ics`;
  }
};
export {
  api
};
