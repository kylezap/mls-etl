import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const propertyStatuses = ['Active', 'Pending', 'Sold', 'Expired'] as const
const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi Family'] as const
const propertySubTypes = ['Detached', 'Attached', 'Garden', 'High Rise', 'Mid Rise'] as const
const standardStatuses = ['Active', 'Pending', 'Sold', 'Expired', 'Withdrawn', 'Canceled'] as const

function generateMockProperty() {
  const status = faker.helpers.arrayElement(propertyStatuses)
  const propertyType = faker.helpers.arrayElement(propertyTypes)
  const propertySubType = faker.helpers.arrayElement(propertySubTypes)
  const standardStatus = faker.helpers.arrayElement(standardStatuses)
  const bedrooms = faker.number.int({ min: 1, max: 6 })
  const bathrooms = faker.number.float({ min: 1, max: 5, precision: 0.5 })
  const squareFeet = faker.number.int({ min: 800, max: 5000 })
  const lotSize = faker.number.float({ min: 0.1, max: 2, precision: 0.1 })
  const yearBuilt = faker.number.int({ min: 1950, max: 2024 })
  const listPrice = faker.number.float({ min: 200000, max: 2000000, precision: 1000 })
  const listingDate = faker.date.past({ years: 1 })
  const lastUpdated = faker.date.recent({ days: 30 })
  const daysOnMarket = faker.number.int({ min: 1, max: 365 })
  const latitude = faker.location.latitude()
  const longitude = faker.location.longitude()

  return {
    mlsNumber: faker.string.numeric(8),
    streetAddress: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    propertyType,
    listPrice,
    bedrooms,
    bathrooms,
    squareFeet,
    lotSize,
    yearBuilt,
    description: faker.lorem.paragraphs(2),
    photos: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
      faker.image.urlLoremFlickr({ category: 'house' })
    ),
    status,
    listingDate,
    lastUpdated,
    mlsId: faker.string.alphanumeric(10),
    mlsStatus: status,
    standardStatus,
    propertySubType,
    listingId: faker.string.alphanumeric(12),
    daysOnMarket,
    taxId: faker.string.alphanumeric(10),
    virtualTourUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.3 }),
    latitude,
    longitude
  }
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.property.deleteMany()

  // Generate and insert mock properties
  console.log('Generating mock properties...')
  const properties = Array.from({ length: 50 }, generateMockProperty)

  console.log('Inserting properties into database...')
  for (const property of properties) {
    await prisma.property.create({
      data: property
    })
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 