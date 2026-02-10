const express = require('express');
const cors = require('cors');
const connectDB = require('./db/connection');
const analyzeRoutes = require('./routes/analyze');
const reportsRoutes = require('./routes/reports');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', analyzeRoutes);
app.use('/api', reportsRoutes);
app.use('/api/competitor', require('./routes/competitor'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WebAudit AI Backend',
    version: '2.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      getReport: 'GET /api/reports/:id',
      listReports: 'GET /api/reports',
      health: 'GET /api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
