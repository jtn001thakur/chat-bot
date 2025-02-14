 import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import parseDeviceInfo from './middleware/deviceInfo.middleware.js';

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://127.0.0.1:5173',  // Alternative localhost
  'https://yourdomain.com'  // Production domain when applicable
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Access-Control-Allow-Credentials',
    'User-Agent'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); 
app.use(morgan('dev'));
app.use(parseDeviceInfo); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
});

export default app;
