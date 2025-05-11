# MLS-ETL

A Node.js application for extracting, transforming, and loading MLS (Multiple Listing Service) data into a PostgreSQL database.

## Features

- Automated ETL process for MLS data
- Real-time data synchronization
- Admin dashboard for monitoring and control
- RESTful API endpoints
- PostgreSQL database integration
- Comprehensive error handling and logging

## Admin Dashboard

The admin dashboard provides a modern interface for monitoring and controlling the ETL process:

- Real-time status updates
- Property statistics and metrics
- Manual ETL process triggering
- Property listing management
- Responsive design with mobile support

### Dashboard Features

- **Status Monitoring**: View current ETL status, last run time, and next scheduled run
- **Property Statistics**: Track total properties, active listings, pending sales, and sold properties
- **Recent Properties**: View latest property updates with detailed information
- **Manual Control**: Trigger ETL process manually when needed
- **Real-time Updates**: Long-polling implementation for immediate status changes

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd node-etl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:setup
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

## Configuration

1. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/mls_etl"
   PORT=3001
   ```

2. Configure your MLS API credentials in the `.env` file:
   ```env
   MLS_API_KEY=your_api_key
   MLS_API_SECRET=your_api_secret
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. Start the admin dashboard (in a separate terminal):
   ```bash
   cd admin
   npm install
   npm run dev
   ```

The backend server will run on port 3001, and the admin dashboard will be available at http://localhost:3000.

## Available Scripts

- `npm start`: Start the backend server
- `npm run dev`: Start the backend server in development mode
- `npm run build`: Build the backend application
- `npm test`: Run tests
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio
- `npm run db:setup`: Set up the database (Unix/Mac)
- `npm run db:setup:win`: Set up the database (Windows)
- `npm run db:check`: Check database status (Unix/Mac)
- `npm run db:check:win`: Check database status (Windows)

## API Endpoints

### Admin Dashboard

- `GET /api/health`: Health check endpoint
- `GET /api/admin/status`: Get ETL process status
- `GET /api/admin/updates`: Long-polling endpoint for real-time updates
- `POST /api/admin/etl/run`: Trigger ETL process manually

### Property Management

- `GET /api/properties`: List all properties
- `GET /api/properties/:id`: Get property details
- `GET /api/properties/status/:status`: Get properties by status

## Development

### Backend

The backend is built with:
- Node.js
- Express
- Prisma
- PostgreSQL
- TypeScript

### Admin Dashboard

The admin dashboard is built with:
- React
- Vite
- Tailwind CSS
- Headless UI
- TypeScript

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 