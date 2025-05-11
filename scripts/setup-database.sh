#!/bin/bash

# PostgreSQL configuration
DB_NAME="property_etl"
DB_USER="postgres"
DB_USER_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up PostgreSQL database for Property ETL Service${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null
then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi

# Check if PostgreSQL server is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}PostgreSQL server is not running. Please start the PostgreSQL server.${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating database...${NC}"

# Create the database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create database.${NC}"
    exit 1
fi

echo -e "${GREEN}Database '$DB_NAME' created or already exists.${NC}"

# Update the .env file with the correct database URL
echo -e "${YELLOW}Updating .env file with database connection...${NC}"

# Check if .env exists, if not create from example.env
if [ ! -f ".env" ]; then
    if [ -f "example.env" ]; then
        cp example.env .env
        echo -e "${GREEN}Created .env file from example.env${NC}"
    else
        echo -e "${RED}example.env file does not exist. Creating a new .env file.${NC}"
        touch .env
    fi
fi

# Update the DATABASE_URL in .env
if grep -q "DATABASE_URL" .env; then
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://${DB_USER}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public\"|" .env && rm .env.bak
else
    echo "DATABASE_URL=\"postgresql://${DB_USER}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public\"" >> .env
fi

echo -e "${GREEN}Updated DATABASE_URL in .env file.${NC}"

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Prisma client.${NC}"
    exit 1
fi

# Run Prisma migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to run Prisma migrations.${NC}"
    echo -e "${YELLOW}You may need to create the first migration manually:${NC}"
    echo -e "${YELLOW}npx prisma migrate dev --name init${NC}"
    exit 1
fi

echo -e "${GREEN}Database setup completed successfully!${NC}"
echo -e "${GREEN}You can now start the ETL service with 'npm run dev' or 'npm start'${NC}" 