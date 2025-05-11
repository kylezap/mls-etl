import cron from 'node-cron';
import config from '../config/config';
import logger from '../utils/logger';
import propertyEtlJob from './propertyEtlJob';

class JobScheduler {
  private scheduledJobs: cron.ScheduledTask[] = [];

  /**
   * Start the ETL job scheduler
   */
  start(): void {
    logger.info('Starting job scheduler');
    
    // Schedule the property ETL job
    this.schedulePropertyEtlJob();
    
    logger.info('Job scheduler started successfully');
  }

  /**
   * Schedule the property ETL job using the configured cron schedule
   */
  private schedulePropertyEtlJob(): void {
    const schedule = config.etl.jobSchedule;
    
    logger.info(`Scheduling property ETL job with cron schedule: ${schedule}`);
    
    const job = cron.schedule(schedule, async () => {
      logger.info('Running scheduled property ETL job');
      
      try {
        const result = await propertyEtlJob.run();
        
        if (result.success) {
          logger.info('Scheduled property ETL job completed successfully', {
            processed: result.processed,
            saved: result.saved,
          });
        } else {
          logger.warn('Scheduled property ETL job completed with errors', {
            processed: result.processed,
            saved: result.saved,
            errors: result.errors,
          });
        }
      } catch (error) {
        logger.error('Scheduled property ETL job failed', { error });
      }
    });
    
    this.scheduledJobs.push(job);
    logger.info('Property ETL job scheduled successfully');
  }

  /**
   * Manually trigger the property ETL job outside of the schedule
   */
  async triggerPropertyEtlJob(): Promise<{
    success: boolean;
    processed: number;
    saved: number;
    errors: number;
  }> {
    logger.info('Manually triggering property ETL job');
    
    try {
      const result = await propertyEtlJob.run();
      
      logger.info('Manual property ETL job completed', {
        success: result.success,
        processed: result.processed,
        saved: result.saved,
        errors: result.errors,
      });
      
      return result;
    } catch (error) {
      logger.error('Manual property ETL job failed', { error });
      
      return {
        success: false,
        processed: 0,
        saved: 0,
        errors: 1,
      };
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    logger.info('Stopping job scheduler');
    
    this.scheduledJobs.forEach(job => job.stop());
    this.scheduledJobs = [];
    
    logger.info('Job scheduler stopped successfully');
  }
}

export default new JobScheduler(); 