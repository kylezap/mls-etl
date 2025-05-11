-- Script to create Property ETL database
-- Run this script as a PostgreSQL superuser (e.g., postgres)

-- Check if database exists and create if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'property_etl') THEN
        CREATE DATABASE property_etl;
    END IF;
END
$$;

\c property_etl;

-- Create a schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Grant privileges
GRANT ALL ON SCHEMA public TO public;

-- Create an index to improve query performance for property lookups
-- Note: Actual tables will be created by Prisma migrations
-- This is just an example of additional SQL that might be helpful

-- Example indexing (will be applied after Prisma creates tables):
-- CREATE INDEX IF NOT EXISTS idx_properties_mls_number ON properties (mls_number);
-- CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
-- CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
-- CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);

-- Print completion message
\echo 'Property ETL database setup complete!' 