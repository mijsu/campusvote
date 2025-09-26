import { z } from "zod";

// User schema for file-based JSON storage
export const userSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "admin"]),
  passwordHash: z.string(),
  votedElections: z.record(z.array(z.string())).default({}), // { electionId: [positionIds] }
});

export const insertUserSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "admin"]),
  password: z.string(),
});

export const loginSchema = z.object({
  studentId: z.string(),
  password: z.string(),
  role: z.enum(["student", "admin"]),
});

// Candidate schema
export const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  photo: z.string().optional(),
  goals: z.string().optional(),
});

// Position schema
export const positionSchema = z.object({
  id: z.string(),
  title: z.string(),
  maxVotes: z.number().min(1),
  candidates: z.array(candidateSchema),
});

// Election schema
export const electionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  startDate: z.string(), // ISO string
  endDate: z.string(), // ISO string
  positions: z.array(positionSchema),
  createdBy: z.string(), // admin studentId
  createdAt: z.string(), // ISO string
});

export const insertElectionSchema = electionSchema.omit({ 
  id: true, 
  createdBy: true, 
  createdAt: true 
});

// Vote schema (before encryption)
export const voteSchema = z.object({
  electionId: z.string(),
  studentId: z.string(),
  votes: z.record(z.string()), // { positionId: candidateId }
  timestamp: z.string(), // ISO string
  ipAddress: z.string(),
});

// Audit log entry schema
export const auditLogEntrySchema = z.object({
  timestamp: z.string(), // ISO string
  userId: z.string(),
  action: z.string(),
  details: z.string(),
  ipAddress: z.string(),
});

// Election results schema
export const electionResultsSchema = z.object({
  electionId: z.string(),
  title: z.string(),
  totalVotes: z.number(),
  eligibleVoters: z.number(),
  results: z.array(z.object({
    positionId: z.string(),
    positionTitle: z.string(),
    candidates: z.array(z.object({
      candidateId: z.string(),
      candidateName: z.string(),
      voteCount: z.number(),
      percentage: z.number(),
    })),
  })),
  generatedAt: z.string(), // ISO string
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Election = z.infer<typeof electionSchema>;
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Vote = z.infer<typeof voteSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type ElectionResults = z.infer<typeof electionResultsSchema>;
