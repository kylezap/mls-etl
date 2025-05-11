# PostgreSQL configuration
$DB_NAME = "property_etl"
$DB_USER = "postgres"
$DB_USER_PASSWORD = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Setting up PostgreSQL database for Property ETL Service" -ForegroundColor Yellow

# Check if PostgreSQL is installed
try {
    $psqlVersion = & psql --version
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

Write-Host "Using $psqlVersion" -ForegroundColor Cyan

# Create database connection string for psql
$env:PGPASSWORD = $DB_USER_PASSWORD

Write-Host "Creating database..." -ForegroundColor Yellow

# Check if database exists
$dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'"

if ($dbExists -notmatch "1") {
    # Create the database
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create database." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database '$DB_NAME' created successfully." -ForegroundColor Green
} else {
    Write-Host "Database '$DB_NAME' already exists." -ForegroundColor Green
}

# Update the .env file with the correct database URL
Write-Host "Updating .env file with database connection..." -ForegroundColor Yellow

# Check if .env exists, if not create from example.env
if (-not (Test-Path ".env")) {
    if (Test-Path "example.env") {
        Copy-Item "example.env" -Destination ".env"
        Write-Host "Created .env file from example.env" -ForegroundColor Green
    } else {
        Write-Host "example.env file does not exist. Creating a new .env file." -ForegroundColor Yellow
        New-Item -Path ".env" -ItemType File
    }
}

# Update the DATABASE_URL in .env
$envContent = Get-Content ".env" -Raw
$connectionString = "postgresql://${DB_USER}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

if ($envContent -match "DATABASE_URL=") {
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=`"$connectionString`""
} else {
    $envContent += "`nDATABASE_URL=`"$connectionString`""
}

Set-Content -Path ".env" -Value $envContent

Write-Host "Updated DATABASE_URL in .env file." -ForegroundColor Green

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma client." -ForegroundColor Red
    exit 1
}

# Run Prisma migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to run Prisma migrations." -ForegroundColor Red
    Write-Host "You may need to create the first migration manually:" -ForegroundColor Yellow
    Write-Host "npx prisma migrate dev --name init" -ForegroundColor Yellow
    exit 1
}

Write-Host "Database setup completed successfully!" -ForegroundColor Green
Write-Host "You can now start the ETL service with 'npm run dev' or 'npm start'" -ForegroundColor Green 