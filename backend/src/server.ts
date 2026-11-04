import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import adminCasesRoutes from './routes/adminCases.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import quotationsRoutes from './routes/quotations.routes.js';
import productsRoutes from './routes/products.routes.js';
import staffRoutes from './routes/staff.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import customersDirectoryRoutes from './routes/customers.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import activityLogsRoutes from './routes/activityLogs.routes.js';
import employeeProfileRoutes from './routes/employeeProfile.routes.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Real-time case room handling
io.on('connection', (socket) => {
  socket.on('join_case', (caseId: string) => {
    if (caseId) {
      socket.join(`case_${caseId}`);
    }
  });

  socket.on('leave_case', (caseId: string) => {
    if (caseId) {
      socket.leave(`case_${caseId}`);
    }
  });

  socket.on('disconnect', () => {});
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logging in dev
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (config.nodeEnv === 'development') {
    console.log(`[${req.method}] ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'Betongportalen API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', customerRoutes);
app.use('/api/admin/cases', adminCasesRoutes);
app.use('/api', messagesRoutes);
app.use('/api/admin', messagesRoutes);
app.use('/api/admin', quotationsRoutes);
app.use('/api', productsRoutes);
app.use('/api/admin/staff', staffRoutes);
app.use('/api', settingsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/customers', customersDirectoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/activity-logs', activityLogsRoutes);
app.use('/api/employee', employeeProfileRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = config.port;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  Betongportalen Backend API Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Listening on: 0.0.0.0:${PORT}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

export default app;
