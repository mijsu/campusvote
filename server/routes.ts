import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { 
  loginSchema, 
  insertUserSchema, 
  insertElectionSchema,
  voteSchema,
  type User,
  type Election,
  type Vote,
  type AuditLogEntry
} from "@shared/schema";

// Session user type
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to check if user is student
const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(403).json({ error: "Student access required" });
  }
  next();
};

// Audit logging helper
const logAudit = async (req: Request, action: string, details: string, userId?: string) => {
  const actualUserId = userId || req.session.user?.studentId || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

  const auditEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    userId: actualUserId,
    action,
    details,
    ipAddress,
  };

  await storage.logAudit(auditEntry);
};

// Multer configuration for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'data', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Simple vote serialization for development
// In production, this should use proper encryption
const encryptVote = (voteData: Vote): string => {
  try {
    // For development, we'll just stringify with a simple prefix
    // This makes it clear this is NOT for production use
    return 'DEV_MODE_' + JSON.stringify(voteData);
  } catch (error) {
    console.error('Vote serialization failed:', error);
    throw new Error('Failed to process vote data');
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin endpoint: Recompute totalVotes for all elections from user votes
  app.post('/api/admin/elections/recompute-all-stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      const results = await storage.recomputeAllElectionStatsFromUsers();
      await logAudit(req, 'RECOMPUTE_ALL_STATS', `Recomputed stats for all elections`);
      res.json({ message: 'Recomputed all election stats', results });
    } catch (error) {
      console.error('Recompute all stats error:', error);
      res.status(500).json({ error: 'Failed to recompute all stats' });
    }
  });

  // =============================================================================
  // ANNOUNCEMENT ROUTES
  // =============================================================================

  // Get all announcements (students & admins)
  app.get('/api/announcements', requireAuth, async (req: Request, res: Response) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  // Create announcement (admin only)
  app.post('/api/announcements', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, content, createdAt } = req.body;
      console.log('Incoming create announcement body:', { title, content, createdAt });
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const announcement = await storage.createAnnouncement({
        title,
        content,
        author: req.session.user!.name || req.session.user!.studentId,
        createdAt,
      });
      console.log('Created announcement:', announcement);
      await logAudit(req, 'CREATE_ANNOUNCEMENT', `Created announcement: ${announcement.id}`);
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  // Delete announcement (admin only)
  app.delete('/api/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      await logAudit(req, 'DELETE_ANNOUNCEMENT', `Deleted announcement: ${req.params.id}`);
      res.json({ message: 'Announcement deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // =============================================================================
  // AUTHENTICATION ROUTES
  // =============================================================================

  // Student signup endpoint
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { studentId, name, email, password } = req.body;

      // Validation
      if (!studentId || !name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByStudentId(studentId);
      if (existingUser) {
        return res.status(400).json({ error: "Student ID already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create user
      const userData = {
        studentId,
        name,
        email,
        password,
        role: 'student' as const
      };

      const user = await storage.createUser(userData);

      // Set session
      req.session.user = user;

      await logAudit(req, 'SIGNUP_SUCCESS', `Student registered: ${studentId}`);

      // Return user without password hash
      const { passwordHash, ...userResponse } = user;
      res.status(201).json({ user: userResponse });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { studentId, password, role } = loginSchema.parse(req.body);

      // Get user from storage
      const user = await storage.getUserByStudentId(studentId);

      if (!user) {
        await logAudit(req, 'LOGIN_FAILED', `Invalid student ID: ${studentId}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        await logAudit(req, 'LOGIN_FAILED', `Invalid password for: ${studentId}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check role matches
      if (user.role !== role) {
        await logAudit(req, 'LOGIN_FAILED', `Role mismatch for: ${studentId} (expected ${role}, got ${user.role})`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session.user = user;

      await logAudit(req, 'LOGIN_SUCCESS', `User logged in: ${studentId}`);

      // Return user without password hash
      const { passwordHash, ...userResponse } = user;
      res.json({ user: userResponse });

    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.studentId;

      await logAudit(req, 'LOGOUT', `User logged out: ${userId}`, userId);

      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: "Logout failed" });
        }

        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const { passwordHash, ...userResponse } = req.session.user!;
    res.json({ user: userResponse });
  });

  // =============================================================================
  // ELECTION ROUTES
  // =============================================================================

  // Get individual election details
  app.get('/api/elections/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const election = await storage.getElection(id);

      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }

      // Calculate status
      const now = new Date();
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);

      let status: 'upcoming' | 'active' | 'closed';
      if (now < startDate) {
        status = 'upcoming';
      } else if (now > endDate) {
        status = 'closed';
      } else {
        status = 'active';
      }

      const response = {
        ...election,
        status
      };

      res.json(response);
    } catch (error) {
      console.error('Failed to fetch election:', error);
      res.status(500).json({ error: 'Failed to fetch election' });
    }
  });

  // Get all elections for current user
  app.get('/api/elections', requireAuth, async (req: Request, res: Response) => {
    try {
      const elections = await storage.getAllElections();

      // Filter elections based on user role
      if (req.session.user!.role === 'student') {
        // Students see all elections but with voting status
        const filteredElections = elections;

        // Add voting status for each election
        const electionsWithStatus = await Promise.all(
          filteredElections.map(async (election) => {
            const hasVoted = await storage.hasUserVoted(req.session.user!.studentId, election.id);
            const votedPositions = req.session.user!.votedElections[election.id] || [];

            return {
              ...election,
              hasVoted,
              votedPositions,
              // Remove sensitive admin info for students
              createdBy: undefined,
            };
          })
        );

        res.json(electionsWithStatus);
      } else {
        // Admins see all elections
        res.json(elections);
      }

    } catch (error) {
      console.error('Get elections error:', error);
      res.status(500).json({ error: "Failed to fetch elections" });
    }
  });

  // Create election (admin only)
  app.post('/api/elections', requireAdmin, async (req: Request, res: Response) => {
    try {
      const electionData = insertElectionSchema.parse(req.body);

      const election = await storage.createElection(electionData, req.session.user!.studentId);

      await logAudit(req, 'CREATE_ELECTION', `Created election: ${election.id}`);

      res.status(201).json(election);

    } catch (error) {
      console.error('Create election error:', error);
      res.status(400).json({ error: "Failed to create election" });
    }
  });

  // Update election (admin only)
  app.put('/api/elections/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = insertElectionSchema.partial().parse(req.body);

      const election = await storage.updateElection(req.params.id, updates);

      await logAudit(req, 'UPDATE_ELECTION', `Updated election: ${req.params.id}`);

      res.json(election);

    } catch (error) {
      console.error('Update election error:', error);
      res.status(400).json({ error: "Failed to update election" });
    }
  });

  // Delete election (admin only)
  app.delete('/api/elections/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteElection(req.params.id);

      await logAudit(req, 'DELETE_ELECTION', `Deleted election: ${req.params.id}`);

      res.json({ message: "Election deleted successfully" });

    } catch (error) {
      console.error('Delete election error:', error);
      res.status(400).json({ error: "Failed to delete election" });
    }
  });

  // =============================================================================
  // VOTING ROUTES
  // =============================================================================

  // Submit vote (student only)
  app.post('/api/elections/:id/vote', requireStudent, async (req: Request, res: Response) => {
    try {
      const electionId = req.params.id;
      const { votes } = req.body; // { positionId: candidateId }

      console.log('Vote submission received:', { electionId, votes });

      // Check if election exists
      const election = await storage.getElection(electionId);
      if (!election) {
        console.log('Election not found:', electionId);
        return res.status(404).json({ error: "Election not found" });
      }

      // Check if voting is currently allowed
      const now = new Date().toISOString();
      if (now < election.startDate || now > election.endDate) {
        console.log('Voting not allowed:', { now, startDate: election.startDate, endDate: election.endDate });
        return res.status(400).json({ error: "Voting is not currently allowed for this election" });
      }

      // Check if user has already voted
      const hasVoted = await storage.hasUserVoted(req.session.user!.studentId, electionId);
      if (hasVoted) {
        console.log('User already voted:', { studentId: req.session.user!.studentId, electionId });
        return res.status(400).json({ error: "You have already voted in this election" });
      }

      // Validate votes
      const positionIds = Object.keys(votes);
      const validPositions = election.positions.map(p => p.id);

      console.log('Validating votes:', { positionIds, validPositions });

      for (const positionId of positionIds) {
        if (!validPositions.includes(positionId)) {
          console.log('Invalid position:', positionId);
          return res.status(400).json({ error: `Invalid position: ${positionId}` });
        }

        const position = election.positions.find(p => p.id === positionId)!;
        const candidateId = votes[positionId];

        if (!position.candidates.find(c => c.id === candidateId)) {
          console.log('Invalid candidate:', { positionId, candidateId });
          return res.status(400).json({ error: `Invalid candidate for position ${positionId}` });
        }
      }

      // Create vote object
      const voteData: Vote = {
        electionId,
        studentId: req.session.user!.studentId,
        votes,
        timestamp: now,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      };

      console.log('Saving vote:', { voteData });

      // Encrypt and save vote
      let encryptedVote;
      try {
        console.log('Encrypting vote data:', voteData);
        encryptedVote = encryptVote(voteData);
        console.log('Vote encrypted successfully');
      } catch (error) {
        console.error('Vote encryption error:', error);
        return res.status(500).json({ error: "Failed to process vote" });
      }

      console.log('Saving encrypted vote...');
      const voteId = await storage.saveVote(voteData, encryptedVote);
      console.log('Vote saved with ID:', voteId);

      // Mark user as voted
      await storage.markUserVoted(req.session.user!.studentId, electionId, positionIds);
      console.log('User marked as voted for positions:', positionIds);

      // Update session user
      if (!req.session.user!.votedElections) {
        req.session.user!.votedElections = {};
      }
      req.session.user!.votedElections[electionId] = positionIds;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await logAudit(req, 'CAST_VOTE', `Vote cast in election: ${electionId}`);

      console.log('Vote submitted successfully:', { voteId, positionIds });

      res.json({ 
        message: "Vote submitted successfully",
        voteId,
        positions: positionIds,
        hasVoted: true
      });

    } catch (error) {
      console.error('Vote submission error:', error);
      res.status(400).json({ error: "Failed to submit vote" });
    }
  });

  // Check voting status
  app.get('/api/elections/:id/vote-status', requireStudent, async (req: Request, res: Response) => {
    try {
      const hasVoted = await storage.hasUserVoted(req.session.user!.studentId, req.params.id);
      const votedPositions = req.session.user!.votedElections[req.params.id] || [];

      res.json({ hasVoted, votedPositions });

    } catch (error) {
      console.error('Vote status error:', error);
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  // Get basic election results for students (closed elections only)
  app.get('/api/elections/:id/results', requireAuth, async (req: Request, res: Response) => {
    try {
      const election = await storage.getElection(req.params.id);
      
      if (!election) {
        return res.status(404).json({ error: "Election not found" });
      }

      // Check if election is closed
      const now = new Date();
      const endDate = new Date(election.endDate);
      
      if (now <= endDate) {
        return res.status(400).json({ error: "Results not available until election ends" });
      }

      const results = await storage.getElectionResults(req.params.id);

      if (!results) {
        return res.status(404).json({ error: "Results not found" });
      }

      // For students, return basic results without sensitive admin data
      if (req.session.user!.role === 'student') {
        const studentResults = {
          ...results,
          // Remove any sensitive admin information if needed
          auditLogs: undefined
        };
        res.json(studentResults);
      } else {
        // Admins get full results
        res.json(results);
      }

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // =============================================================================
  // ADMIN ROUTES
  // =============================================================================

  // Get all users (admin only)
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();

      // Remove password hashes from response
      const usersResponse = users.map(({ passwordHash, ...user }) => user);

      res.json(usersResponse);

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create user (admin only)
  app.post('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const user = await storage.createUser(userData);

      await logAudit(req, 'CREATE_USER', `Created user: ${user.studentId}`);

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;
      res.status(201).json(userResponse);

    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  // Get audit logs (admin only)
  app.get('/api/admin/audit-logs', requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);

      res.json(logs);

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Get election results (admin only)
  app.get('/api/admin/elections/:id/results', requireAdmin, async (req: Request, res: Response) => {
    try {
      const results = await storage.getElectionResults(req.params.id);

      if (!results) {
        return res.status(404).json({ error: "Results not found" });
      }

      res.json(results);

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Recompute election stats from stored vote files (admin only)
  app.post('/api/admin/elections/:id/recompute-stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      const electionId = req.params.id;
      const result = await storage.recomputeElectionStats(electionId);

      await logAudit(req, 'RECOMPUTE_STATS', `Recomputed stats for election: ${electionId}`);

      res.json({ electionId, totalVotes: result.totalVotes });
    } catch (error) {
      console.error('Recompute stats error:', error);
      res.status(500).json({ error: 'Failed to recompute stats' });
    }
  });

  // Export election results as CSV (admin only)
  app.get('/api/admin/elections/:id/export', requireAdmin, async (req: Request, res: Response) => {
    try {
      const results = await storage.getElectionResults(req.params.id);

      if (!results) {
        return res.status(404).json({ error: "Results not found" });
      }

      const csvPath = await storage.exportResultsToCSV(results);

      await logAudit(req, 'EXPORT_RESULTS', `Exported results for election: ${req.params.id}`);

      res.download(csvPath);

    } catch (error) {
      console.error('Export results error:', error);
      res.status(500).json({ error: "Failed to export results" });
    }
  });

  // =============================================================================
  // FILE UPLOAD ROUTES
  // =============================================================================

  // Upload candidate photo (admin only)
  app.post('/api/upload/candidate-photo', requireAdmin, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      await logAudit(req, 'UPLOAD_PHOTO', `Uploaded candidate photo: ${req.file.filename}`);

      res.json({ 
        filename: req.file.filename,
        path: `/api/uploads/${req.file.filename}`
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({ error: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.use('/api/uploads', requireAuth, (req: Request, res: Response, next: NextFunction) => {
    // Serve files from uploads directory
    const filePath = path.join(process.cwd(), 'data', 'uploads', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}