import axios from 'axios';

export interface MLSProperty {
  ListingKey: string;
  ListPrice: number;
  PropertyType: string;
  StandardStatus: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  UnparsedAddress: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  YearBuilt: number;
  Media: Array<{
    MediaKey: string;
    MediaURL: string;
  }>;
  Features: Array<{
    FeatureKey: string;
    FeatureName: string;
  }>;
}

export class MLSClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.MLS_API_URL || '';
    this.apiKey = process.env.MLS_API_KEY || '';
  }

  async getProperties(): Promise<MLSProperty[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/properties`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data?.properties) {
        throw new Error('Invalid response format');
      }

      return response.data.properties;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
      }
      throw error;
    }
  }

  async getPropertyDetails(listingKey: string): Promise<MLSProperty> {
    try {
      const response = await axios.get(`${this.baseUrl}/properties/${listingKey}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data?.property) {
        throw new Error('Invalid response format');
      }

      return response.data.property;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch property details: ${error.message}`);
      }
      throw error;
    }
  }
} 