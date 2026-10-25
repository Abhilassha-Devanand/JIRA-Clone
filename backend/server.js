const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');

const app = express();

// Core Middleware
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple Request Logger in Dev
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'Project & Task Workspace Management API is operational',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      status: states[dbState] || 'unknown',
      connected: dbState === 1,
    },
    version: '1.0.0',
  });
});

// Mount API Domain Routes
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);


// Placeholder 404 handler for unhandled routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server after the database is ready
let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Jira Workspace Server running on http://localhost:${env.PORT}`);
    console.log(`⚙️  Environment: ${env.NODE_ENV}`);
    console.log(`📡 Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer().catch(() => {
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;
