import config from '../config/config';
import logger from '../utils/logger';
import mlsApiService from '../services/mlsApiService';
import propertyTransformService from '../services/propertyTransformService';
import propertyDbService from '../services/propertyDbService';

class PropertyEtlJob {
  private batchSize: number;
  
  constructor() {
    this.batchSize = config.etl.batchSize;
  }
  
  /**
   * Run the ETL job
   * @returns Object with job status and statistics
   */
  async run(): Promise<{ success: boolean; processed: number; saved: number; errors: number }> {
    logger.info('Starting property ETL job');
    
    let offset = 0;
    let hasMoreData = true;
    let processedCount = 0;
    let savedCount = 0;
    let errorCount = 0;
    
    try {
      // Get the last update date to only fetch newer properties
      const lastUpdateDate = await propertyDbService.getLastUpdateDate();
      logger.info(`Last update date: ${lastUpdateDate || 'None - will fetch all properties'}`);
      
      // Process properties in batches
      while (hasMoreData) {
        // Extract: Fetch properties from the MLS API
        const response = await mlsApiService.fetchProperties({
          limit: this.batchSize,
          offset,
          lastUpdateDate: lastUpdateDate || undefined,
        });
        
        if (!response.success) {
          logger.error('Failed to fetch properties from MLS API');
          errorCount++;
          break;
        }
        
        const { results, count } = response;
        processedCount += count;
        
        if (count === 0) {
          logger.info('No properties found to process');
          hasMoreData = false;
          break;
        }
        
        logger.info(`Processing batch of ${count} properties (offset: ${offset})`);
        
        try {
          // Transform: Convert MLS data to our schema
          const transformedProperties = results.map(propertyData => 
            propertyTransformService.transformProperty(propertyData)
          );
          
          // Load: Save properties to the database
          const batchSavedCount = await propertyDbService.saveProperties(transformedProperties);
          savedCount += batchSavedCount;
          
          logger.info(`Saved ${batchSavedCount} properties to database`);
          
          // Prepare for next batch
          offset += count;
          
          // Check if we have more data to process
          hasMoreData = response.pagination?.next !== null && count === this.batchSize;
        } catch (error) {
          logger.error('Error processing property batch', { error, offset });
          errorCount++;
          
          // Continue with next batch even if this one failed
          offset += count;
        }
      }
      
      logger.info(`ETL job completed: Processed ${processedCount} properties, saved ${savedCount}, errors ${errorCount}`);
      
      return {
        success: errorCount === 0,
        processed: processedCount,
        saved: savedCount,
        errors: errorCount,
      };
    } catch (error) {
      logger.error('ETL job failed with an error', { error });
      
      return {
        success: false,
        processed: processedCount,
        saved: savedCount,
        errors: errorCount + 1,
      };
    }
  }
}

export default new PropertyEtlJob(); 