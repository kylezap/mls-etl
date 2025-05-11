import { MLSClient } from '../services/mls';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MLSClient', () => {
  let mlsClient: MLSClient;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of MLSClient for each test
    mlsClient = new MLSClient();
  });

  describe('getProperties', () => {
    it('should fetch properties from MLS API', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          properties: [
            {
              ListingKey: '123',
              ListPrice: 500000,
              PropertyType: 'Residential',
              StandardStatus: 'Active',
              City: 'Test City',
              StateOrProvince: 'CA',
              PostalCode: '12345',
              UnparsedAddress: '123 Test St',
              BedroomsTotal: 3,
              BathroomsTotalInteger: 2,
              LivingArea: 2000,
              YearBuilt: 2020,
              Media: [
                { MediaKey: '1', MediaURL: 'http://example.com/image1.jpg' }
              ],
              Features: [
                { FeatureKey: '1', FeatureName: 'Pool' }
              ]
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mlsClient.getProperties();

      expect(result).toEqual(mockResponse.data.properties);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/properties'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(mlsClient.getProperties()).rejects.toThrow('API Error');
    });

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValue({ data: { properties: [] } });

      const result = await mlsClient.getProperties();
      expect(result).toEqual([]);
    });

    it('should handle malformed response', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });

      await expect(mlsClient.getProperties()).rejects.toThrow('Invalid response format');
    });
  });

  describe('getPropertyDetails', () => {
    it('should fetch property details from MLS API', async () => {
      const mockResponse = {
        data: {
          property: {
            ListingKey: '123',
            ListPrice: 500000,
            // ... other property fields
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mlsClient.getPropertyDetails('123');

      expect(result).toEqual(mockResponse.data.property);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/properties/123'),
        expect.any(Object)
      );
    });

    it('should handle API errors when fetching property details', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(mlsClient.getPropertyDetails('123')).rejects.toThrow('API Error');
    });
  });
}); 