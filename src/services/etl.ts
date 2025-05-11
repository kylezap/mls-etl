import { MLSClient } from './mls';
import { PrismaClient, Property } from '@prisma/client';

export class ETLService {
  private prisma: PrismaClient;
  private mlsClient: MLSClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.mlsClient = new MLSClient();
  }

  async extract() {
    try {
      const properties = await this.mlsClient.getProperties();
      return properties;
    } catch (error) {
      console.error('Failed to extract data from MLS API');
      throw error;
    }
  }

  transform(properties: any[]) {
    return properties.map(property => ({
      mlsNumber: property.ListingKey,
      mlsId: property.ListingKey,
      listingId: property.ListingKey,
      listPrice: property.ListPrice,
      propertyType: property.PropertyType,
      propertySubType: property.PropertySubType || 'Single Family',
      status: property.StandardStatus,
      mlsStatus: property.StandardStatus,
      standardStatus: property.StandardStatus,
      city: property.City,
      state: property.StateOrProvince,
      zipCode: property.PostalCode,
      streetAddress: property.UnparsedAddress,
      bedrooms: property.BedroomsTotal,
      bathrooms: property.BathroomsTotalInteger,
      squareFeet: property.LivingArea,
      yearBuilt: property.YearBuilt,
      lotSize: property.LotSize || 0,
      description: property.PublicRemarks || '',
      photos: property.Media?.map((m: any) => m.MediaURL) || [],
      listingDate: new Date(),
      lastUpdated: new Date(),
      daysOnMarket: property.DaysOnMarket || 0,
      taxId: property.TaxId || '',
      virtualTourUrl: property.VirtualTourURL || '',
      latitude: property.Latitude || 0,
      longitude: property.Longitude || 0
    }));
  }

  async load(properties: any[]): Promise<Property[]> {
    const savedProperties: Property[] = [];

    for (const property of properties) {
      const savedProperty = await this.prisma.property.upsert({
        where: { mlsNumber: property.mlsNumber },
        update: property,
        create: property
      });

      savedProperties.push(savedProperty);
    }

    return savedProperties;
  }

  async run() {
    try {
      const extractedData = await this.extract();
      const transformedData = this.transform(extractedData);
      const loadedData = await this.load(transformedData);
      return loadedData;
    } catch (error) {
      console.error('ETL process failed');
      throw error;
    }
  }
} 