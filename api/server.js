import express from 'express';
import { registerRoutes } from '../server/routes';
import cookieSession from 'cookie-session';
import serverless from 'serverless-http';

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for serverless
app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE_SECRET || 'change-this-in-prod'],
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
}));

// Register API routes
registerRoutes(app);

// Error handling
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Export a serverless handler for Vercel
export const handler = serverless(app);
export default handler;