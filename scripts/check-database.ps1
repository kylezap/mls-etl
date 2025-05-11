# PostgreSQL configuration - these should match your setup-database.ps1 values
$DB_NAME = "property_etl"
$DB_USER = "postgres"
$DB_USER_PASSWORD = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "PostgreSQL Database Inspector" -ForegroundColor Yellow
Write-Host "Checking database: $DB_NAME" -ForegroundColor Cyan

# Check if PostgreSQL is installed
try {
    $psqlVersion = & psql --version
    Write-Host "Using $psqlVersion" -ForegroundColor Gray
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Load database connection from .env if exists
if (Test-Path ".env") {
    Write-Host "Loading database configuration from .env file..." -ForegroundColor Yellow
    
    # Extract DATABASE_URL from .env file
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_URL="([^"]+)"') {
        $DB_URL = $matches[1]
        
        # Parse the URL to extract components
        if ($DB_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)') {
            $DB_USER = $matches[1]
            $DB_USER_PASSWORD = $matches[2]
            $DB_HOST = $matches[3]
            $DB_PORT = $matches[4]
            $DB_NAME = ($matches[5] -split '\?')[0]
            Write-Host "Successfully extracted database configuration from .env" -ForegroundColor Green
        } else {
            Write-Host "Could not parse DATABASE_URL, using default values" -ForegroundColor Yellow
        }
    } else {
        Write-Host "DATABASE_URL not found in .env, using default values" -ForegroundColor Yellow
    }
} else {
    Write-Host "No .env file found, using default database configuration" -ForegroundColor Yellow
}

# Set up password for psql
$env:PGPASSWORD = $DB_USER_PASSWORD

# Check if the database exists
try {
    $dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | Select-String -Pattern $DB_NAME
    if (-not $dbExists) {
        Write-Host "Database '$DB_NAME' does not exist." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database '$DB_NAME' exists." -ForegroundColor Green
} catch {
    Write-Host "Error connecting to PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

# Connect to the database and list tables
Write-Host "`nTables in database:" -ForegroundColor Yellow
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt;"

# Count rows in each table
Write-Host "`nRow counts:" -ForegroundColor Yellow

# Get list of tables
$tableQuery = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public';"
$tablesRaw = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $tableQuery

# Format the results into an array
$tables = @()
foreach ($line in $tablesRaw) {
    $trimmedLine = $line.Trim()
    if ($trimmedLine) {
        $tables += $trimmedLine
    }
}

if ($tables.Count -eq 0) {
    Write-Host "  No tables found in database." -ForegroundColor Red
} else {
    # Create a SQL query to count rows in each table
    $sqlQuery = ""
    foreach ($table in $tables) {
        $sqlQuery += "SELECT '$table' as table_name, COUNT(*) as row_count FROM $table UNION ALL "
    }
    
    # Remove the last UNION ALL and execute the query
    if ($sqlQuery) {
        $sqlQuery = $sqlQuery.Substring(0, $sqlQuery.Length - 11)
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$sqlQuery ORDER BY table_name;"
    }
}

# Check properties table schema if it exists
if ($tables -contains "properties") {
    Write-Host "`nProperties table schema:" -ForegroundColor Yellow
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d properties;"
    
    # Display a sample of property data if there are any rows
    $propertyCountRaw = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM properties;"
    $propertyCount = [int]($propertyCountRaw -replace '\s','')
    
    if ($propertyCount -gt 0) {
        Write-Host "`nSample property data (5 most recent):" -ForegroundColor Yellow
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, mls_number, property_type, city, state, list_price, last_updated FROM properties ORDER BY last_updated DESC LIMIT 5;"
    } else {
        Write-Host "`n  No property data found in the database." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n  Properties table not found. Has the initial migration been run?" -ForegroundColor Yellow
}

# Check database size
Write-Host "`nDatabase size:" -ForegroundColor Yellow
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;"

# Reset password environment variable
$env:PGPASSWORD = ""

Write-Host "`nDatabase inspection complete!" -ForegroundColor Green 