import { env } from "../config/env.js";
class IcsService {
  /**
   * Generates standard RFC 5545 iCalendar content (.ics)
   */
  generateCalendarEvent(meeting, hostName, hostEmail) {
    const startTime = meeting.scheduledStartTime || meeting.actualStartTime || /* @__PURE__ */ new Date();
    const durationMinutes = meeting.scheduledDuration || 30;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1e3);
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    const meetingUrl = `${env.CLIENT_URL}/meeting/${meeting.meetingCode}`;
    const dtStamp = formatDate(/* @__PURE__ */ new Date());
    const dtStart = formatDate(startTime);
    const dtEnd = formatDate(endTime);
    const uid = `meetspace-${meeting.meetingCode}-${startTime.getTime()}@meetspace.dev`;
    const description = `Join MeetSpace Video Conference

Meeting URL: ${meetingUrl}
Passcode: ${meeting.passcode || "None"}

${meeting.description || ""}`;
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MeetSpace//Video Collaboration Platform//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      `LOCATION:${meetingUrl}`,
      `ORGANIZER;CN="${hostName}":mailto:${hostEmail}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  }
}
const icsService = new IcsService();
export {
  IcsService,
  icsService
};
