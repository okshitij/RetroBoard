# RetroBoard

A real-time collaborative retrospective board application built with React, TypeScript, Node.js, and Socket.io. Perfect for agile teams to conduct sprint retrospectives, share feedback, and track action items in real-time.

## Features

- **Real-time Collaboration**: Multiple users can work on the same board simultaneously with live updates
- **User Authentication**: Secure login and registration system with JWT tokens
- **Board Management**: Create, share, and manage multiple retrospective boards
- **Note Cards**: Add, edit, and organize notes with different categories (What went well, What didn't go well, Action items)
- **Live Presence Indicators**: See who's currently viewing or editing the board
- **Countdown Timer**: Built-in timer for time-boxed retrospective activities
- **PDF Export**: Export boards to PDF for documentation and sharing
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **ESLint** - Code linting and formatting

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Puppeteer** - PDF generation

## Project Structure

```
RetroBoard/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API and socket services
│   │   └── assets/         # Static assets
│   ├── public/             # Public static files
│   └── package.json
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── sockets/        # Socket.io handlers
│   │   ├── config/         # Database configuration
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   └── package.json
└── README.md
```

## Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RetroBoard
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/retrospect
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system.

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### Production Build

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Build and start the server**
   ```bash
   cd server
   npm run build
   npm start
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Board Endpoints
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Note Endpoints
- `GET /api/boards/:boardId/notes` - Get board notes
- `POST /api/boards/:boardId/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## Socket Events

### Board Events
- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `note-added` - New note added to board
- `note-updated` - Note updated
- `note-deleted` - Note deleted
- `user-joined` - User joined the board
- `user-left` - User left the board

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For questions or support, please open an issue in the GitHub repository.