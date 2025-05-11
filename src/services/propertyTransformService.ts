import { Property } from '@prisma/client';
import logger from '../utils/logger';

interface MLSProperty {
  ListingId: string;
  ListingKey?: string;
  StandardStatus: string;
  MlsStatus: string;
  PropertyType: string;
  PropertySubType?: string;
  UnparsedAddress: string;
  StreetNumber?: string;
  StreetName?: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  BedroomsTotal?: number;
  BathroomsTotal?: number;
  LivingArea?: number;
  LotSizeArea?: number;
  YearBuilt?: number;
  ListPrice: number;
  PublicRemarks?: string;
  Media?: Array<{ MediaURL: string }>;
  ListingContractDate?: string;
  ModificationTimestamp: string;
  TaxParcelIdentification?: string;
  VirtualTourURLUnbranded?: string;
  Latitude?: number;
  Longitude?: number;
}

class PropertyTransformService {
  /**
   * Transform MLS property data to our database schema
   * @param mlsProperty Property data from MLS API
   * @returns Transformed property data compatible with our database
   */
  transformProperty(mlsProperty: MLSProperty): Omit<Property, 'createdAt' | 'lastUpdated'> {
    try {
      // Extract address components
      const streetAddress = mlsProperty.UnparsedAddress || 
        `${mlsProperty.StreetNumber || ''} ${mlsProperty.StreetName || ''}`.trim();

      // Extract photos URLs
      const photos = (mlsProperty.Media || [])
        .map(media => media.MediaURL)
        .filter(url => !!url);

      // Transform the listing date
      const listingDate = mlsProperty.ListingContractDate ? 
        new Date(mlsProperty.ListingContractDate) : 
        new Date();

      return {
        id: mlsProperty.ListingKey || `mls-${mlsProperty.ListingId}`,
        mlsNumber: mlsProperty.ListingId,
        streetAddress,
        city: mlsProperty.City,
        state: mlsProperty.StateOrProvince,
        zipCode: mlsProperty.PostalCode,
        propertyType: mlsProperty.PropertyType,
        listPrice: mlsProperty.ListPrice,
        bedrooms: mlsProperty.BedroomsTotal || null,
        bathrooms: mlsProperty.BathroomsTotal || null,
        squareFeet: mlsProperty.LivingArea ? Math.round(mlsProperty.LivingArea) : null,
        lotSize: mlsProperty.LotSizeArea || null,
        yearBuilt: mlsProperty.YearBuilt || null,
        description: mlsProperty.PublicRemarks || null,
        photos,
        status: mlsProperty.StandardStatus,
        listingDate,
        
        // RESO specific fields
        mlsId: mlsProperty.ListingId,
        mlsStatus: mlsProperty.MlsStatus,
        standardStatus: mlsProperty.StandardStatus,
        propertySubType: mlsProperty.PropertySubType || null,
        listingId: mlsProperty.ListingId,
        daysOnMarket: this.calculateDaysOnMarket(mlsProperty.ListingContractDate),
        taxId: mlsProperty.TaxParcelIdentification || null,
        virtualTourUrl: mlsProperty.VirtualTourURLUnbranded || null,
        
        // Coordinates
        latitude: mlsProperty.Latitude || null,
        longitude: mlsProperty.Longitude || null,
      };
    } catch (error) {
      logger.error('Error transforming property data', { error, property: mlsProperty });
      throw new Error('Failed to transform property data');
    }
  }

  /**
   * Calculate days on market based on listing date
   * @param listingDate The original listing date
   * @returns Number of days on market
   */
  private calculateDaysOnMarket(listingDate?: string): number | null {
    if (!listingDate) return null;
    
    const listDate = new Date(listingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

export default new PropertyTransformService(); 