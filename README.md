# Acta API

A comprehensive, production-ready backend API for collaborative task and note management. Built with modern technologies and best practices for scalability, security, and developer experience.

## Overview

**Acta API** is a robust Node.js backend service that powers the Acta application—a collaborative platform designed for managing shopping lists, notes, polls, and group activities. The API emphasizes offline-first synchronization, real-time collaboration, and secure multi-user group management.

### Key Features

- **User Authentication & Authorization**: JWT-based authentication with bcrypt password hashing
- **Group Collaboration**: Create and manage groups with role-based access control
- **Smart Synchronization**: Offline-first architecture with intelligent sync capabilities for seamless client experiences
- **Multi-feature Support**:
  - Shopping lists with item management
  - Notes and note comments
  - Polls and voting systems
  - Activity logging and audit trails
  - Notification system for group events
  - File uploads with image optimization
- **Security**: Helmet.js protection, CORS configuration, input validation, and secure middleware
- **Developer-Friendly**: TypeScript for type safety, comprehensive error handling, and modular architecture

---

## Technology Stack

| Layer | Technology |
|:---|:---|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js 5.x |
| **Language** | TypeScript 5.x |
| **Database** | MongoDB (9.x) with Mongoose 9.x |
| **Authentication** | JWT + bcryptjs |
| **Security** | Helmet.js, CORS |
| **File Handling** | Multer, Sharp (image optimization) |
| **Logging** | Morgan |
| **Development** | Nodemon, ts-node |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally or in the cloud (MongoDB Atlas recommended)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stefan0712/Acta-api.git
   cd Acta-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/Acta
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. **Run the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

The API will be available at `http://localhost:5000/api`

---

## 📡 API Reference

**Base URL**: `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| POST | `/auth/register` | Create a new user account | No |
| POST | `/auth/login` | Authenticate and receive JWT token | No |
| GET | `/auth/me` | Get current authenticated user data | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/users/:id` | Get user profile | Yes |
| PUT | `/users/:id` | Update user profile | Yes |

### Group Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/groups` | List all user's groups | Yes |
| POST | `/groups` | Create a new group | Yes |
| GET | `/groups/:id` | Get group details | Yes |
| PUT | `/groups/:id` | Update group information | Yes |
| DELETE | `/groups/:id` | Delete a group | Yes |
| GET | `/groups/:id/leave` | Leave a group | Yes |
| GET | `/groups/invite/lookup` | Lookup invite details | No |
| POST | `/groups/invite/accept` | Accept group invite | Yes |
| GET | `/groups/:id/invite/generate` | Generate invite token | Yes |

### Shopping List Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/lists` | Get all lists in a group | Yes |
| POST | `/lists` | Create a new shopping list | Yes |
| GET | `/lists/:id` | Get specific list | Yes |
| PUT | `/lists/:id` | Update list details | Yes |
| DELETE | `/lists/:id` | Delete a list | Yes |

### Shopping List Item Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/items` | Get items from a list | Yes |
| POST | `/items` | Create a new item | Yes |
| PUT | `/items/:id` | Update item | Yes |
| DELETE | `/items/:id` | Delete item | Yes |

### Notes Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/notes` | Get all notes | Yes |
| POST | `/notes` | Create a note | Yes |
| PUT | `/notes/:id` | Update note | Yes |
| DELETE | `/notes/:id` | Delete note | Yes |
| POST | `/notes/:id/comments` | Add comment to note | Yes |

### Polls Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/polls` | Get all polls | Yes |
| POST | `/polls` | Create a poll | Yes |
| PUT | `/polls/:id/vote` | Vote on poll | Yes |

### Activity & Notifications

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| GET | `/activities` | Get activity logs | Yes |
| GET | `/notifications` | Get user notifications | Yes |
| PUT | `/notifications/:id` | Mark notification as read | Yes |

### File Upload

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| POST | `/upload` | Upload file (image optimization included) | Yes |

---

## Project Structure

```
src/
├── config/              # Configuration files (database, constants)
├── controllers/         # Route handlers and business logic
│   ├── authController.ts
│   ├── groupController.ts
│   ├── listController.ts
│   ├── itemController.ts
│   ├── noteController.ts
│   ├── pollController.ts
│   └── ...
├── models/             # MongoDB schemas and Mongoose models
│   ├── User.ts
│   ├── Group.ts
│   ├── ShoppingList.ts
│   ├── Note.ts
│   ├── Poll.ts
│   └── ...
├── routes/             # API route definitions
├── middleware/         # Custom middleware (auth, validation, uploads)
├── utilities/          # Helper functions and business logic
│   ├── groupUtilities.ts
│   ├── permissions.ts
│   ├── logActivity.ts
│   └── notificationHelpers.ts
├── types/              # TypeScript type definitions
├── db.ts               # Database connection
└── index.ts            # Application entry point
```

---

## Architecture & Design Patterns

### Authentication Flow
- User registration with bcrypt password hashing
- JWT token generation on login
- Token-based middleware protection for authenticated routes
- Secure token validation on each request

### Database Design
- MongoDB with Mongoose ODM for type-safe operations
- Relational integrity through ObjectId references
- Indexed queries for optimal performance
- Activity logging for audit trails

### Synchronization
- Offline-first data handling
- Client-side cache support
- Efficient sync endpoints for data consistency
- Timestamp-based conflict resolution

### Error Handling
- Centralized error handling middleware
- Consistent HTTP status codes
- Descriptive error messages
- Logging of errors for debugging

---

## Security Features

✅ **JWT Authentication** - Secure token-based user sessions
✅ **Password Hashing** - bcryptjs with salt rounds
✅ **Helmet.js** - HTTP security headers protection
✅ **CORS** - Cross-origin resource sharing configuration
✅ **Input Validation** - Data validation in controllers and middleware
✅ **File Upload Security** - Multer with size limits and type validation
✅ **Role-Based Access** - Group permission management

---

## Development

### Scripts

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Code Quality
- **TypeScript** for type safety
- **Modular architecture** for maintainability
- **Clear separation of concerns** between layers
- **Comprehensive error handling**

---

## Deployment

The API is configured for deployment on **Vercel** (see `vercel.json` configuration file).

### Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)

---

## Future Enhancements

- Real-time updates using WebSocket/Socket.io
- Advanced analytics dashboard
- Export functionality (CSV, PDF)
- Rate limiting and throttling
- Caching layer with Redis
- Comprehensive API testing suite
- API documentation with Swagger/OpenAPI

---

## License

This project is private and proprietary.

