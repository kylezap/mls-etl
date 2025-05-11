#!/bin/bash

# PostgreSQL configuration - these should match your setup-database.sh values
DB_NAME="property_etl"
DB_USER="postgres"
DB_USER_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${YELLOW}${BOLD}PostgreSQL Database Inspector${NC}"
echo -e "${YELLOW}Checking database: ${BLUE}${DB_NAME}${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null
then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi

# Load database connection from .env if exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading database configuration from .env file...${NC}"
    # Extract DATABASE_URL from .env file
    DB_URL=$(grep -o 'DATABASE_URL=.*' .env | cut -d '"' -f 2)
    if [ ! -z "$DB_URL" ]; then
        # Parse the URL to extract components
        if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_USER_PASSWORD="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]%\?*}"
            echo -e "${GREEN}Successfully extracted database configuration from .env${NC}"
        else
            echo -e "${YELLOW}Could not parse DATABASE_URL, using default values${NC}"
        fi
    else
        echo -e "${YELLOW}DATABASE_URL not found in .env, using default values${NC}"
    fi
else
    echo -e "${YELLOW}No .env file found, using default database configuration${NC}"
fi

# Check if PostgreSQL server is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${RED}PostgreSQL server is not running at ${DB_HOST}:${DB_PORT}. Please start the PostgreSQL server.${NC}"
    exit 1
fi

echo -e "${YELLOW}Connecting to PostgreSQL...${NC}"

# Export password for psql
export PGPASSWORD="$DB_USER_PASSWORD"

# Check if the database exists
DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -w $DB_NAME)
if [ -z "$DB_EXISTS" ]; then
    echo -e "${RED}Database '${DB_NAME}' does not exist.${NC}"
    exit 1
fi

echo -e "${GREEN}Database '${DB_NAME}' exists.${NC}"

# Connect to the database and list tables
echo -e "\n${YELLOW}${BOLD}Tables in database:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt;" | sed 's/^/  /'

# Count rows in each table
echo -e "\n${YELLOW}${BOLD}Row counts:${NC}"

# Get list of tables
TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public';")

if [ -z "$TABLES" ]; then
    echo -e "${RED}  No tables found in database.${NC}"
else
    # Create a SQL query to count rows in each table
    SQL_QUERY=""
    for TABLE in $TABLES; do
        # Remove any whitespace from table name
        TABLE=$(echo $TABLE | xargs)
        SQL_QUERY+="SELECT '$TABLE' as table_name, COUNT(*) as row_count FROM $TABLE UNION ALL "
    done
    
    # Remove the last UNION ALL and execute the query
    if [ ! -z "$SQL_QUERY" ]; then
        SQL_QUERY=${SQL_QUERY%UNION ALL }
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_QUERY ORDER BY table_name;" | sed 's/^/  /'
    fi
fi

# Check properties table schema if it exists
if echo "$TABLES" | grep -q "properties"; then
    echo -e "\n${YELLOW}${BOLD}Properties table schema:${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d properties;" | sed 's/^/  /'
    
    # Display a sample of property data if there are any rows
    PROPERTY_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM properties;")
    if [ "$PROPERTY_COUNT" -gt "0" ]; then
        echo -e "\n${YELLOW}${BOLD}Sample property data (5 most recent):${NC}"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, mls_number, property_type, city, state, list_price, last_updated FROM properties ORDER BY last_updated DESC LIMIT 5;" | sed 's/^/  /'
    else
        echo -e "\n${YELLOW}  No property data found in the database.${NC}"
    fi
else
    echo -e "\n${YELLOW}  Properties table not found. Has the initial migration been run?${NC}"
fi

# Check database size
echo -e "\n${YELLOW}${BOLD}Database size:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;" | sed 's/^/  /'

# Reset password environment variable
unset PGPASSWORD

echo -e "\n${GREEN}${BOLD}Database inspection complete!${NC}" 