import { PrismaClient } from '@prisma/client';

// Declare global type for prisma
declare global {
  var prisma: PrismaClient;
}

// Create a new Prisma client for testing
const prisma = new PrismaClient();

// Clean up database before each test
beforeEach(async () => {
  try {
    // Delete all records from all tables
    const tables = ['properties', 'property_media', 'property_features'];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (error) {
        // Silently skip if table doesn't exist yet
      }
    }
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
});

// Close Prisma connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally for tests
global.prisma = prisma; 