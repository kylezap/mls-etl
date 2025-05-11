import express from 'express';
import config from './config/config';
import logger from './utils/logger';
import etlRoutes from './routes/etlRoutes';
import jobScheduler from './jobs/scheduler';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/etl', etlRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const port = config.server.port;
app.listen(port, () => {
  logger.info(`Server started on http://localhost:${port}`);
  
  // Start the job scheduler
  jobScheduler.start();
}); 