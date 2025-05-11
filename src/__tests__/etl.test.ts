import { ETLService } from '../services/etl';
import { MLSClient } from '../services/mls';
import { Property } from '@prisma/client';

// Mock the MLS client
jest.mock('../services/mls');

describe('ETLService', () => {
  let etlService: ETLService;
  let mockMLSClient: jest.Mocked<MLSClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of ETLService for each test
    etlService = new ETLService();
    
    // Get the mocked MLS client instance
    mockMLSClient = (MLSClient as jest.MockedClass<typeof MLSClient>).mock.instances[0] as jest.Mocked<MLSClient>;
  });

  describe('extract', () => {
    it('should fetch properties from MLS API', async () => {
      // Mock MLS client response
      const mockProperties = [
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
      ];

      mockMLSClient.getProperties.mockResolvedValue(mockProperties);

      const result = await etlService.extract();
      expect(result).toEqual(mockProperties);
      expect(mockMLSClient.getProperties).toHaveBeenCalledTimes(1);
    });

    it('should handle MLS API errors', async () => {
      mockMLSClient.getProperties.mockRejectedValue(new Error('API Error'));

      await expect(etlService.extract()).rejects.toThrow('API Error');
    });
  });

  describe('transform', () => {
    it('should transform MLS data to database schema', () => {
      const mockMLSData = [
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
      ];

      const result = etlService.transform(mockMLSData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        mlsNumber: '123',
        listPrice: 500000,
        propertyType: 'Residential',
        status: 'Active',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        streetAddress: '123 Test St',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        yearBuilt: 2020,
        photos: ['http://example.com/image1.jpg']
      });
    });
  });

  describe('load', () => {
    it('should save properties to database', async () => {
      const mockProperties = [
        {
          mlsNumber: '123',
          mlsId: 'MLS123',
          listingId: 'LIST123',
          listPrice: 500000,
          propertyType: 'Residential',
          propertySubType: 'Single Family',
          status: 'Active',
          mlsStatus: 'Active',
          standardStatus: 'Active',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          streetAddress: '123 Test St',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          yearBuilt: 2020,
          lotSize: 5000,
          description: 'Beautiful home with pool',
          photos: ['http://example.com/image1.jpg'],
          listingDate: new Date(),
          lastUpdated: new Date(),
          daysOnMarket: 30,
          taxId: 'TAX123',
          virtualTourUrl: 'http://example.com/tour',
          latitude: 37.7749,
          longitude: -122.4194
        }
      ];

      const result = await etlService.load(mockProperties);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        mlsNumber: '123',
        listPrice: 500000
      });

      // Verify the property was saved in the database
      const savedProperty = await prisma.property.findUnique({
        where: { mlsNumber: '123' }
      });
      expect(savedProperty).toBeTruthy();
      expect(savedProperty?.listPrice).toBe(500000);
    });
  });

  describe('run', () => {
    it('should execute the full ETL process', async () => {
      // Mock the extract, transform, and load methods
      const mockExtract = jest.spyOn(etlService, 'extract');
      const mockTransform = jest.spyOn(etlService, 'transform');
      const mockLoad = jest.spyOn(etlService, 'load');

      // Mock the data flow
      const mockMLSData = [
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
      ];

      const mockTransformedData = [
        {
          mlsNumber: '123',
          mlsId: 'MLS123',
          listingId: 'LIST123',
          listPrice: 500000,
          propertyType: 'Residential',
          propertySubType: 'Single Family',
          status: 'Active',
          mlsStatus: 'Active',
          standardStatus: 'Active',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          streetAddress: '123 Test St',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          yearBuilt: 2020,
          lotSize: 5000,
          description: 'Beautiful home with pool',
          photos: ['http://example.com/image1.jpg'],
          listingDate: new Date(),
          lastUpdated: new Date(),
          daysOnMarket: 30,
          taxId: 'TAX123',
          virtualTourUrl: 'http://example.com/tour',
          latitude: 37.7749,
          longitude: -122.4194
        }
      ];

      const mockLoadedData = [
        {
          id: '1',
          mlsNumber: '123',
          mlsId: 'MLS123',
          listingId: 'LIST123',
          listPrice: 500000,
          propertyType: 'Residential',
          propertySubType: 'Single Family',
          status: 'Active',
          mlsStatus: 'Active',
          standardStatus: 'Active',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          streetAddress: '123 Test St',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          yearBuilt: 2020,
          lotSize: 5000,
          description: 'Beautiful home with pool',
          photos: ['http://example.com/image1.jpg'],
          listingDate: new Date(),
          lastUpdated: new Date(),
          daysOnMarket: 30,
          taxId: 'TAX123',
          virtualTourUrl: 'http://example.com/tour',
          latitude: 37.7749,
          longitude: -122.4194,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockExtract.mockResolvedValue(mockMLSData);
      mockTransform.mockReturnValue(mockTransformedData);
      mockLoad.mockResolvedValue(mockLoadedData);

      const result = await etlService.run();

      expect(mockExtract).toHaveBeenCalledTimes(1);
      expect(mockTransform).toHaveBeenCalledWith(mockMLSData);
      expect(mockLoad).toHaveBeenCalledWith(mockTransformedData);
      expect(result).toEqual(mockLoadedData);
    });

    it('should handle errors during the ETL process', async () => {
      // Mock the extract method to throw an error
      const mockExtract = jest.spyOn(etlService, 'extract');
      mockExtract.mockRejectedValue(new Error('ETL process failed'));

      await expect(etlService.run()).rejects.toThrow('ETL process failed');
    });
  });
}); 