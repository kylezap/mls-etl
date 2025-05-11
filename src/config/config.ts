import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/property_etl?schema=public',
  },
  mls: {
    apiUrl: process.env.MLS_API_URL || 'https://api.mlsservice.com/v1',
    apiKey: process.env.MLS_API_KEY || '',
    apiSecret: process.env.MLS_API_SECRET || '',
  },
  etl: {
    jobSchedule: process.env.ETL_JOB_SCHEDULE || '0 0 * * *', // Daily at midnight (cron format)
    batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config; 