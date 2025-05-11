import { Request, Response } from 'express';
import jobScheduler from '../jobs/scheduler';
import propertyDbService from '../services/propertyDbService';
import logger from '../utils/logger';

class EtlController {
  /**
   * Trigger the property ETL job manually
   */
  async triggerJob(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Manual ETL job triggered via API');
      
      const result = await jobScheduler.triggerPropertyEtlJob();
      
      res.status(200).json({
        success: true,
        message: 'ETL job completed',
        data: result,
      });
    } catch (error) {
      logger.error('Error triggering ETL job via API', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to trigger ETL job',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get ETL job status and statistics
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      // Get the last update date
      const lastUpdateDate = await propertyDbService.getLastUpdateDate();
      
      // Get total property count
      const { total } = await propertyDbService.getProperties({ limit: 0 });
      
      res.status(200).json({
        success: true,
        data: {
          lastUpdateDate,
          totalProperties: total,
        },
      });
    } catch (error) {
      logger.error('Error fetching ETL status via API', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get ETL status',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get the most recent properties
   */
  async getRecentProperties(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      const { properties } = await propertyDbService.getProperties({
        limit,
        orderBy: 'lastUpdated',
        orderDir: 'desc',
      });
      
      res.status(200).json({
        success: true,
        data: {
          properties,
          count: properties.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching recent properties via API', { error });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get recent properties',
        error: (error as Error).message,
      });
    }
  }
}

export default new EtlController(); 