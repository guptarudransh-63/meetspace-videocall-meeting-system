import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env.js";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MeetSpace API Documentation",
      version: "1.0.0",
      description: "REST API documentation for MeetSpace Video Conferencing & Collaboration Platform",
      contact: {
        name: "MeetSpace Engineering"
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Local Development Server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            timezone: { type: "string" },
            avatarUrl: { type: "string" }
          }
        },
        Meeting: {
          type: "object",
          properties: {
            id: { type: "string" },
            meetingCode: { type: "string", example: "abc-defg-hij" },
            title: { type: "string" },
            description: { type: "string" },
            scheduledStartTime: { type: "string", format: "date-time" },
            scheduledDuration: { type: "number", example: 30 },
            status: { type: "string", enum: ["scheduled", "active", "ended", "cancelled"] },
            isWaitingRoomEnabled: { type: "boolean" },
            isLocked: { type: "boolean" },
            chatEnabled: { type: "boolean" }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"]
};
const swaggerSpec = swaggerJsdoc(options);
export {
  swaggerSpec
};
