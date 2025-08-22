# Bookmark Manager API

A RESTful API built with NestJS and TypeScript for managing bookmarks with user authentication and tag-based search functionality.

## Features

- 🔐 **User Authentication**: JWT-based authentication with registration and login
- 📚 **Bookmark Management**: Full CRUD operations for bookmarks
- 🏷️ **Tag System**: Organize bookmarks with tags and search by tags
- 🔍 **Search & Filter**: Search bookmarks by title, description, URL, or tags
- 🗄️ **SQLite Database**: Lightweight database with Prisma ORM
- ✅ **Input Validation**: Comprehensive validation with class-validator
- 🚀 **Production Ready**: CORS enabled, global validation, proper error handling

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone and install dependencies:
```bash
git clone <your-repo>
cd bookmark-manager-api
pnpm install
```

2. Set up environment variables:
```bash
# Create .env file in root directory
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
```

3. Set up the database:
```bash
# Set environment variable and run migration
$env:DATABASE_URL="file:./dev.db"  # Windows PowerShell
# or
export DATABASE_URL="file:./dev.db"  # Linux/Mac

npx prisma migrate dev --name init
```

4. Start the development server:
```bash
$env:DATABASE_URL="file:./dev.db"; pnpm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### User Endpoints

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <jwt_token>
```

### Bookmark Endpoints

All bookmark endpoints require authentication (Bearer token).

#### Create Bookmark
```http
POST /api/bookmarks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Example Website",
  "url": "https://example.com",
  "description": "A useful website",
  "tags": ["web", "example", "useful"]
}
```

#### Get All Bookmarks
```http
GET /api/bookmarks?page=1&limit=10&search=example&tags=web,useful
Authorization: Bearer <jwt_token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in title, description, URL
- `tags`: Filter by tags (comma-separated)

#### Get Single Bookmark
```http
GET /api/bookmarks/:id
Authorization: Bearer <jwt_token>
```

#### Update Bookmark
```http
PATCH /api/bookmarks/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "tags": ["updated", "bookmark"]
}
```

#### Delete Bookmark
```http
DELETE /api/bookmarks/:id
Authorization: Bearer <jwt_token>
```

#### Get All Tags
```http
GET /api/bookmarks/tags
Authorization: Bearer <jwt_token>
```

## Database Schema

### User Model
- `id`: Unique identifier
- `email`: User email (unique)
- `username`: Username (unique)
- `password`: Hashed password
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Bookmark Model
- `id`: Unique identifier
- `title`: Bookmark title
- `url`: Bookmark URL
- `description`: Optional description
- `tags`: JSON array of tags
- `userId`: Foreign key to user
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Development

### Available Scripts

```bash
# Development
pnpm run start:dev    # Start with hot reload
pnpm run start:debug  # Start in debug mode

# Building
pnpm run build        # Build for production
pnpm run start:prod   # Start production server

# Testing
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run end-to-end tests
pnpm run test:cov     # Run tests with coverage

# Database
npx prisma migrate dev     # Create new migration
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio

# Linting & Formatting
pnpm run lint         # Lint code
pnpm run format       # Format code
```

### Testing the API

Run the included PowerShell test script:
```powershell
# Start the server first
$env:DATABASE_URL="file:./dev.db"; pnpm run start:dev

# In another terminal, run the test script
.\test-api.ps1
```

## Security Features

- ✅ JWT Authentication with configurable expiration
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ User isolation (users can only access their own bookmarks)

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Security**: bcryptjs for password hashing

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # Auth guards
│   ├── strategies/      # Passport strategies
│   └── auth.service.ts  # Auth business logic
├── bookmark/            # Bookmark module
│   ├── dto/             # DTOs for bookmark operations
│   └── bookmark.service.ts
├── user/                # User module
├── prisma/              # Prisma service
└── main.ts              # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.