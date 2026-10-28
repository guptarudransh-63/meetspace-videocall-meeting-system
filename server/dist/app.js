"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_js_1 = require("./config/env.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const swagger_js_1 = require("./docs/swagger.js");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security Middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // allow Swagger UI and frontend assets
        crossOriginEmbedderPolicy: false,
    }));
    // CORS Configuration
    app.use((0, cors_1.default)({
        origin: [env_js_1.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Parsers
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)(env_js_1.env.COOKIE_SECRET));
    // Rate Limiting
    app.use('/api', rateLimiter_js_1.apiLimiter);
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'meetspace-api',
            environment: env_js_1.env.NODE_ENV,
        });
    });
    // Swagger Documentation
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
    app.get('/api/docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swagger_js_1.swaggerSpec);
    });
    // REST API v1 Routes
    app.use('/api/v1', index_js_1.default);
    // Serve static frontend assets in production or if client/dist exists
    const clientDistPath = path_1.default.resolve(process.cwd(), '../client/dist');
    if (fs_1.default.existsSync(clientDistPath)) {
        app.use(express_1.default.static(clientDistPath));
        app.get('*', (req, res, next) => {
            if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
                return next();
            }
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        });
    }
    // 404 Handler for API endpoints
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: `Endpoint ${req.originalUrl} not found`,
        });
    });
    // Global Error Handler
    app.use(errorHandler_js_1.errorHandler);
    return app;
};
exports.createApp = createApp;
