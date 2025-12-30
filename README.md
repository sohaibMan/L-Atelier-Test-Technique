# Tennis API

This is a REST API designed to manage tennis players and calculate various statistics about them. The application is built using TypeScript and Express.js, with MongoDB as the database and Docker for containerization.

## Live Demo

The API is currently deployed and running on AWS! You can test it right now:

- **Live API**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com
- **Interactive Documentation**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api-docs
- **Health Check**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/health

### Quick Test Examples

Try these live endpoints right now:

```bash
# Get all tennis players
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/players"

# Get tennis statistics
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/players/stats"

# Check application health
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/health"
```

## Getting Started

To get the application running on your local machine, follow these steps:

```bash
# First, clone the repository and install dependencies
git clone <repository-url>
cd l-atelier-test-technique
npm install

# For development, run the app locally with MongoDB in Docker
npm run dev

# Alternatively, run everything in Docker containers
npm run docker:dev

# Once running, you can access:
# - The API at http://localhost:3000
# - Interactive documentation at http://localhost:3000/api-docs
```

## What This API Does

The Tennis API provides several key capabilities:

- Complete player management with create, read, update, and delete operations
- Statistical analysis including win ratios by country, average BMI calculations, and median height
- Interactive API documentation through Swagger/OpenAPI
- Request validation using Zod schemas to ensure data integrity
- Built-in security features including rate limiting and security headers
- Comprehensive logging system powered by Winston
- Extensive test coverage with unit, integration, and end-to-end tests
- Full Docker support for development and production environments
- One-click AWS deployment using CDK infrastructure as code

## How Environment Detection Works

One of the nice features of this application is that it automatically figures out how to connect to MongoDB based on where it's running. You don't need to manually configure different connection strings for different environments.

| Environment | Application | Database | How It Knows |
|-------------|-------------|----------|--------------|
| Development | Your machine | Docker container | This is the default setup |
| Docker | Container | Container | Looks for `DOCKER_ENV=true` |
| AWS Cloud | ECS/Fargate | DocumentDB | Checks if `DOCDB_CLUSTER_ENDPOINT` exists |

## Available API Endpoints

### Working with Players

The API provides these endpoints for managing tennis players:

- `GET /api/players` - Retrieve all players with support for pagination, filtering, and sorting
- `GET /api/players/{id}` - Get details for a specific player  
- `POST /api/players` - Add a new player to the database
- `GET /api/players/stats` - Get interesting statistics calculated from all players

**Live Examples:**
```bash
# Get all players (live)
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/players"

# Get player by ID (live)
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/players/17"

# Get statistics (live)
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/players/stats"
```

### Understanding the Statistics

When you call the `/api/players/stats` endpoint, you'll get back three calculated metrics:
- **Country with best win rate**: Which country's players have the highest winning percentage
- **Average BMI**: The mean Body Mass Index across all players in the database
- **Median height**: The middle value when all player heights are sorted

### System Health and Documentation

- `GET /api/health` - Check if the application and database are running properly
- `GET /api-docs` - Browse the interactive API documentation (very handy for testing)

**Live Examples:**
```bash
# Check application health (live)
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/health"

# Check database health (live)
curl "http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api/health/db"

# Visit interactive documentation (live)
# http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api-docs
```

## Database Setup

The application uses MongoDB and comes with sample data to get you started quickly. When you first run the application, it automatically creates a database with information for 5 well-known tennis players:

- Rafael Nadal from Spain (World Rank 1)
- Novak Djokovic from Serbia (World Rank 2)  
- Serena Williams from USA (World Rank 10)
- Stan Wawrinka from Switzerland (World Rank 21)
- Venus Williams from USA (World Rank 52)

This sample data lets you immediately start testing the API endpoints and see how the statistics calculations work.

## Running Tests

The project includes a comprehensive test suite that you can run in several ways:

```bash
npm test                 # Run the complete test suite
npm run test:coverage    # Run tests and generate a coverage report
npm run test:unit        # Run only the unit tests
npm run test:integration # Run only the integration tests
npm run test:e2e         # Run only the end-to-end tests
```

The test suite is quite thorough, with over 85 individual tests that cover:
- Unit tests to verify business logic works correctly
- Integration tests to ensure API endpoints behave properly
- End-to-end tests that simulate real user workflows
- Database operation testing
- Error handling and edge cases

## Available Commands

Here are all the npm scripts you can use to work with this project:

### Development Commands
```bash
npm run dev              # Start the app in development mode with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Run the compiled production version
```

### Docker Commands
```bash
npm run docker:dev       # Start everything in Docker for development
npm run docker:dev:stop  # Stop the Docker development environment
npm run docker:prod      # Run the production Docker setup
```

### Testing Commands
```bash
npm test                 # Run the full test suite
npm run test:watch       # Run tests continuously as you make changes
npm run test:coverage    # Run tests and see how much code is covered
```

### Code Quality Commands
```bash
npm run lint             # Check your code for style and potential issues
npm run lint:fix         # Automatically fix linting problems where possible
npm run format           # Format your code consistently with Prettier
```

### AWS Deployment Commands
```bash
npm run deploy:aws       # Deploy the entire application to AWS
npm run destroy:aws      # Remove all AWS infrastructure (be careful!)
npm run populate:data    # Add sample data to your database
```

### Utility Commands
```bash
npm run test:env         # Test that environment detection is working correctly
```

## Configuration

The application uses environment variables for configuration. Most of these are set automatically, but here are the key ones you might want to know about:

### Basic Server Settings
```bash
NODE_ENV=development     # Controls various development vs production behaviors
PORT=3000               # Which port the server runs on
HOST=localhost          # The hostname to bind to
```

### Database Connection
The MongoDB connection is configured automatically based on your environment, but these variables control the details:
```bash
MONGO_HOST=localhost          # Changes to 'mongodb' when running in Docker
MONGO_APP_USERNAME=app_user   # Database username
MONGO_APP_PASSWORD=dev_password # Database password
MONGO_INITDB_DATABASE=latelier_dev # Database name
```

### Security Settings
```bash
ALLOWED_ORIGINS=http://localhost:3000 # CORS configuration
RATE_LIMIT_MAX=100                    # Maximum requests per window
JWT_SECRET=your-secret-key            # For any JWT token signing
```

### Environment Detection
```bash
DOCKER_ENV=true              # Set automatically by Docker Compose
DOCDB_CLUSTER_ENDPOINT=...   # Set automatically when deployed to AWS
```

## Deploying to AWS

This project includes everything you need to deploy to Amazon Web Services with a single command. The deployment uses AWS CDK (Cloud Development Kit) to create all the necessary infrastructure.

### Current Deployment Status

**LIVE NOW**: The application is currently deployed and running on AWS!

- **API URL**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com
- **Documentation**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api-docs
- **Health Status**: Healthy and operational
- **Database**: Connected to AWS DocumentDB
- **Load Balancer**: Distributing traffic across 2 instances

### What Gets Created
- **ECS Fargate**: Runs your application containers without managing servers
- **Application Load Balancer**: Distributes incoming traffic across multiple instances
- **Amazon DocumentDB**: A MongoDB-compatible database service
- **VPC with Private Subnets**: Keeps your database secure and isolated
- **Auto Scaling**: Automatically adjusts from 1 to 10 instances based on demand
- **CloudWatch**: Provides logging and monitoring for your application

### How to Deploy
```bash
npm run deploy:aws
```

That's it! The deployment process will create all the infrastructure and give you back a public URL where your API is running. The whole process typically takes about 10-15 minutes.

## Project Organization

Here's how the code is organized to make it easy to find what you're looking for:

```
src/
├── config/          # All configuration files (database, logging, API docs)
├── models/          # Mongoose database models
├── routes/          # Express route handlers
├── schemas/         # Zod schemas for request validation
├── services/        # Business logic and data processing
├── app.ts           # Main Express application setup
└── server.ts        # Server startup and initialization

tests/
├── unit/            # Tests for individual functions and classes
├── integration/     # Tests for API endpoints
└── e2e/             # Full workflow tests

scripts/             # Helpful utility scripts
docker-compose*.yml  # Docker configuration files
cdk/                 # AWS infrastructure code
```

## Contributing to This Project

If you'd like to contribute improvements or fixes, here's the process:

1. Fork this repository to your own GitHub account
2. Create a new branch for your feature or fix
3. Make your changes and write tests for any new functionality
4. Run `npm test` and `npm run lint` to make sure everything works
5. Submit a pull request with a clear description of what you've changed

## Getting Help

If you run into issues or have questions about this project:

- **Email**: sohaib.manah.contact@gmail.com
- **API Documentation**: 
  - **Live**: http://lateli-Latel-xcLvpYSkJDve-878348924.eu-central-1.elb.amazonaws.com/api-docs
  - **Local**: http://localhost:3000/api-docs (when running locally)

The interactive documentation is particularly helpful for understanding the API endpoints and testing them directly in your browser.