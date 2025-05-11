import axios from 'axios';
import config from '../config/config';
import logger from '../utils/logger';

interface MlsApiResponse {
  success: boolean;
  count: number;
  results: any[];
  pagination?: {
    next?: string;
  };
}

class MlsApiService {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.baseUrl = config.mls.apiUrl;
    this.apiKey = config.mls.apiKey;
    this.apiSecret = config.mls.apiSecret;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch properties from the MLS API using RESO Web API standards
   * @param options Query parameters and filters
   * @returns Promise with the API response
   */
  async fetchProperties(options: {
    limit?: number;
    offset?: number;
    filter?: string;
    select?: string;
    orderby?: string;
    lastUpdateDate?: string;
  }): Promise<MlsApiResponse> {
    try {
      const {
        limit = config.etl.batchSize,
        offset = 0,
        filter = '',
        select = '',
        orderby = 'ListingId',
        lastUpdateDate,
      } = options;

      // Build the query using RESO standard parameters
      let queryParams = new URLSearchParams();
      queryParams.append('$top', limit.toString());
      queryParams.append('$skip', offset.toString());
      
      if (select) {
        queryParams.append('$select', select);
      }
      
      if (orderby) {
        queryParams.append('$orderby', orderby);
      }
      
      // Build filter with RESO standards
      let filterString = filter;
      if (lastUpdateDate) {
        const dateFilter = `ModificationTimestamp gt ${lastUpdateDate}`;
        filterString = filterString ? `${filterString} and ${dateFilter}` : dateFilter;
      }
      
      if (filterString) {
        queryParams.append('$filter', filterString);
      }

      const url = `${this.baseUrl}/Property?${queryParams.toString()}`;
      logger.info(`Fetching properties from MLS API: ${url}`);
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      return {
        success: true,
        count: response.data.value?.length || 0,
        results: response.data.value || [],
        pagination: {
          next: response.data['@odata.nextLink'] || null,
        },
      };
    } catch (error) {
      logger.error('Error fetching properties from MLS API', { error });
      return {
        success: false,
        count: 0,
        results: [],
      };
    }
  }

  /**
   * Get property details by MLS number
   * @param mlsNumber The MLS number to look up
   * @returns Promise with property details
   */
  async getPropertyByMlsNumber(mlsNumber: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/Property`;
      const filter = `ListingId eq '${mlsNumber}'`;
      
      const response = await this.fetchProperties({ filter });
      
      return {
        success: true,
        property: response.results.length > 0 ? response.results[0] : null,
      };
    } catch (error) {
      logger.error(`Error fetching property with MLS number ${mlsNumber}`, { error });
      return {
        success: false,
        property: null,
      };
    }
  }
}

export default new MlsApiService(); 