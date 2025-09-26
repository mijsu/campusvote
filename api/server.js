import express from 'express';
import { registerRoutes } from '../server/routes';
import cookieSession from 'cookie-session';
import serverless from 'serverless-http';

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lightweight request logger for debugging in serverless environment
app.use((req, res, next) => {
  try {
    const safeBody = (() => {
      try { return JSON.stringify(req.body); } catch { return '[unserializable]'; }
    })();
    console.log(`[API LOG] ${req.method} ${req.originalUrl} - body: ${safeBody}`);
  } catch (e) {
    console.error('[API LOG] failed to log request', e);
  }
  next();
});

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
  console.error('[API ERROR]', err && err.stack ? err.stack : err);
  res.status(status).json({ message });
});

// Export a serverless handler for Vercel
export const handler = serverless(app);
export default handler;