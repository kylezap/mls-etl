import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { ETLService } from './services/etl';

const app = express();
const prisma = new PrismaClient();
const etlService = new ETLService();

// Store last update timestamp
let lastUpdateTimestamp = new Date().getTime();

// Enable CORS for the admin frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Long polling endpoint for updates
app.get('/api/admin/updates', async (req, res) => {
  const clientTimestamp = parseInt(req.query.since as string) || 0;
  const timeout = 30000; // 30 seconds timeout
  const checkInterval = 1000; // Check every second
  let elapsed = 0;

  const checkForUpdates = async () => {
    try {
      const currentTimestamp = new Date().getTime();
      
      if (currentTimestamp > clientTimestamp) {
        // Get fresh data
        const totalProperties = await prisma.property.count();
        const lastUpdated = await prisma.property.findFirst({
          orderBy: { lastUpdated: 'desc' },
          select: { lastUpdated: true }
        });

        const recentProperties = await prisma.property.findMany({
          orderBy: { lastUpdated: 'desc' },
          take: 10,
          select: {
            id: true,
            mlsNumber: true,
            streetAddress: true,
            city: true,
            state: true,
            listPrice: true,
            status: true,
            lastUpdated: true
          }
        });

        res.json({
          timestamp: currentTimestamp,
          data: {
            status: 'active',
            totalProperties,
            lastUpdated: lastUpdated?.lastUpdated || null,
            properties: recentProperties
          }
        });
        return true;
      }

      elapsed += checkInterval;
      if (elapsed >= timeout) {
        res.json({ timestamp: currentTimestamp, data: null });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in long polling:', error);
      res.status(500).json({ error: 'Failed to fetch updates' });
      return true;
    }
  };

  // Initial check
  if (await checkForUpdates()) return;

  // Set up polling interval
  const interval = setInterval(async () => {
    if (await checkForUpdates()) {
      clearInterval(interval);
    }
  }, checkInterval);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Get ETL status and statistics
app.get('/api/admin/status', async (req, res) => {
  try {
    const totalProperties = await prisma.property.count();
    const lastUpdated = await prisma.property.findFirst({
      orderBy: { lastUpdated: 'desc' },
      select: { lastUpdated: true }
    });

    res.json({
      status: 'active',
      totalProperties,
      lastUpdated: lastUpdated?.lastUpdated || null,
      lastRun: null, // TODO: Implement ETL run tracking
      nextScheduledRun: null // TODO: Implement scheduling
    });
  } catch (error) {
    console.error('Error fetching ETL status:', error);
    res.status(500).json({ error: 'Failed to fetch ETL status' });
  }
});

// Get recent properties
app.get('/api/admin/properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { lastUpdated: 'desc' },
      take: 10,
      select: {
        id: true,
        mlsNumber: true,
        streetAddress: true,
        city: true,
        state: true,
        listPrice: true,
        status: true,
        lastUpdated: true
      }
    });

    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Trigger ETL process manually
app.post('/api/admin/etl/run', async (req, res) => {
  try {
    const result = await etlService.run();
    lastUpdateTimestamp = new Date().getTime(); // Update timestamp after ETL run
    res.json({ 
      success: true, 
      message: 'ETL process completed successfully',
      processedCount: result.length
    });
  } catch (error) {
    console.error('Error running ETL process:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to run ETL process' 
    });
  }
});

const PORT = 3001; // Explicitly set port to 3001

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET  http://localhost:${PORT}/api/health`);
  console.log(`- GET  http://localhost:${PORT}/api/admin/status`);
  console.log(`- GET  http://localhost:${PORT}/api/admin/properties`);
  console.log(`- GET  http://localhost:${PORT}/api/admin/updates`);
  console.log(`- POST http://localhost:${PORT}/api/admin/etl/run`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please make sure no other server is running on this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
}); 