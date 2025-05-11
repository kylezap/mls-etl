import { PrismaClient, Property } from '@prisma/client';
import logger from '../utils/logger';

class PropertyDbService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Save a property to the database (create or update)
   * @param property The property data to save
   * @returns The saved property
   */
  async saveProperty(property: Omit<Property, 'createdAt' | 'lastUpdated'>): Promise<Property> {
    try {
      return await this.prisma.property.upsert({
        where: { mlsNumber: property.mlsNumber },
        update: { ...property },
        create: { ...property },
      });
    } catch (error) {
      logger.error('Error saving property to database', { error, mlsNumber: property.mlsNumber });
      throw new Error(`Failed to save property ${property.mlsNumber}`);
    }
  }

  /**
   * Save multiple properties to the database
   * @param properties Array of property data to save
   * @returns The number of properties saved
   */
  async saveProperties(properties: Omit<Property, 'createdAt' | 'lastUpdated'>[]): Promise<number> {
    try {
      let savedCount = 0;
      
      // Process in batches to avoid overloading the database
      for (const property of properties) {
        await this.saveProperty(property);
        savedCount++;
      }
      
      return savedCount;
    } catch (error) {
      logger.error('Error saving properties to database', { error });
      throw new Error('Failed to save properties');
    }
  }

  /**
   * Get a property by MLS number
   * @param mlsNumber The MLS number to look up
   * @returns The property or null if not found
   */
  async getPropertyByMlsNumber(mlsNumber: string): Promise<Property | null> {
    try {
      return await this.prisma.property.findUnique({
        where: { mlsNumber },
      });
    } catch (error) {
      logger.error(`Error retrieving property with MLS number ${mlsNumber}`, { error });
      return null;
    }
  }

  /**
   * Get properties with pagination
   * @param options Pagination options
   * @returns Paginated properties
   */
  async getProperties(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }): Promise<{ properties: Property[]; total: number }> {
    try {
      const {
        limit = 10,
        offset = 0,
        orderBy = 'lastUpdated',
        orderDir = 'desc',
        filters = {},
      } = options;

      // Build where clause from filters
      const where: any = {};
      
      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }
      
      if (filters.state) {
        where.state = filters.state;
      }
      
      if (filters.propertyType) {
        where.propertyType = filters.propertyType;
      }
      
      if (filters.minPrice) {
        where.listPrice = { ...where.listPrice, gte: parseFloat(filters.minPrice) };
      }
      
      if (filters.maxPrice) {
        where.listPrice = { ...where.listPrice, lte: parseFloat(filters.maxPrice) };
      }
      
      if (filters.minBedrooms) {
        where.bedrooms = { ...where.bedrooms, gte: parseInt(filters.minBedrooms, 10) };
      }
      
      if (filters.status) {
        where.status = filters.status;
      }

      // Get properties
      const [properties, total] = await Promise.all([
        this.prisma.property.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [orderBy]: orderDir },
        }),
        this.prisma.property.count({ where }),
      ]);

      return { properties, total };
    } catch (error) {
      logger.error('Error retrieving properties', { error });
      return { properties: [], total: 0 };
    }
  }

  /**
   * Get the last update date from the database
   * @returns ISO string of the last update date or null if no properties exist
   */
  async getLastUpdateDate(): Promise<string | null> {
    try {
      const latestProperty = await this.prisma.property.findFirst({
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      });
      
      return latestProperty ? latestProperty.lastUpdated.toISOString() : null;
    } catch (error) {
      logger.error('Error retrieving last update date', { error });
      return null;
    }
  }

  /**
   * Close the database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default new PropertyDbService(); 