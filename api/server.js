import express from 'express';
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
  // use the same cookie name as express-session so existing code that
  // clears 'connect.sid' works unchanged
  name: 'connect.sid',
  keys: [process.env.COOKIE_SECRET || 'change-this-in-prod'],
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
}));

// Compatibility helpers: some code expects express-session APIs (save/destroy).
// cookie-session stores session data in the signed cookie and does not
// implement save/destroy. We add small polyfills so existing handlers
// that call req.session.save()/destroy() work in the serverless cookie-backed
// session environment.
app.use((req, res, next) => {
  try {
    if (req.session && typeof req.session.save !== 'function') {
      req.session.save = function(cb) {
        // cookie-session writes the cookie automatically on response; no-op
        if (typeof cb === 'function') cb();
      };
    }

    if (req.session && typeof req.session.destroy !== 'function') {
      req.session.destroy = function(cb) {
        // Clear the session object and let cookie-session clear the cookie
        req.session = null;
        try { res.clearCookie('connect.sid'); } catch (e) {}
        if (typeof cb === 'function') cb();
      };
    }
  } catch (e) {
    // ignore
  }
  next();
});

// Register API routes if available. We dynamically import the routes module
// because the rest of the codebase is TypeScript and may not be
// transpiled in all deployment environments (for example, Vercel functions
// expect JS). A failing import shouldn't break a simple health check like
// /api/ping, so we load routes optionally and log a warning on failure.
async function tryRegisterRoutes(app) {
  try {
    // Try the compiled JS path in dist first (this will be present after
    // we run the TypeScript build step). Then fallback to server/routes.js
    // (compiled next to source), then finally to the TS source if the
    // runtime supports importing .ts directly.
    let mod;
    try {
      mod = await import('../dist/server/routes.js');
    } catch (e1) {
      try {
        mod = await import('../server/routes.js');
      } catch (e2) {
        mod = await import('../server/routes');
      }
    }

    if (mod && typeof mod.registerRoutes === 'function') {
      // registerRoutes may return a server; await it but don't let it block
      await mod.registerRoutes(app);
      console.log('[API] registered routes from server/routes');
    }
  } catch (err) {
    console.warn('[API] optional route registration failed, continuing. Error:', err && err.message ? err.message : err);
  }
}

// Attempt to register routes but don't throw if unavailable
tryRegisterRoutes(app).catch(() => {});

// Simple ping endpoint for quick debugging
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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