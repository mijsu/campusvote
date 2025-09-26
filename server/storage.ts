import { announcementSchema, type Announcement } from "@shared/announcement";
import {
  type User,
  type InsertUser,
  type Election,
  type InsertElection,
  type Vote,
  type AuditLogEntry,
  type ElectionResults,
  userSchema,
  electionSchema,
  voteSchema,
  auditLogEntrySchema,
  electionResultsSchema
} from "@shared/schema";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// File-based storage interface for the Online Voting System
export interface IStorage {
  // User management
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>; // Added for signup validation
  createUser(user: InsertUser): Promise<User>;
  updateUser(studentId: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Election management
  getElection(id: string): Promise<Election | undefined>;
  getAllElections(): Promise<Election[]>;
  createElection(election: InsertElection, createdBy: string): Promise<Election>;
  updateElection(id: string, updates: Partial<Election>): Promise<Election>;
  deleteElection(id: string): Promise<void>;

  // Vote management
  saveVote(vote: Vote, encryptedVoteData: string): Promise<string>; // returns vote file id
  hasUserVoted(studentId: string, electionId: string): Promise<boolean>;
  markUserVoted(studentId: string, electionId: string, positionIds: string[]): Promise<void>;

  // Audit logging
  logAudit(entry: AuditLogEntry): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLogEntry[]>;

  // Results and exports
  getElectionResults(electionId: string): Promise<ElectionResults | undefined>;
  saveElectionResults(results: ElectionResults): Promise<void>;
  exportResultsToCSV(results: ElectionResults): Promise<string>; // returns CSV file path
}

export class FileStorage implements IStorage {
  private readonly dataDir = path.join(process.cwd(), "data");
  private readonly usersFile = path.join(this.dataDir, "users.json");
  private readonly electionsDir = path.join(this.dataDir, "elections");
  private readonly votesDir = path.join(this.dataDir, "votes");
  private readonly uploadsDir = path.join(this.dataDir, "uploads");
  private readonly exportsDir = path.join(this.dataDir, "exports");
  private readonly auditLogFile = path.join(this.dataDir, "audit.log");
  private readonly announcementsFile = path.join(this.dataDir, "announcements.json");
  // Announcement management
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const data = await fs.readFile(this.announcementsFile, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map((a: any) => announcementSchema.parse(a)) : [];
    } catch (error) {
      return [];
    }
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'> & { author: string; createdAt?: string }): Promise<Announcement> {
    const announcements = await this.getAllAnnouncements();
    // If the caller provided createdAt, try to parse and normalize it; otherwise use server time
    let createdAt = new Date().toISOString();
    if (announcement.createdAt) {
      const parsed = new Date(announcement.createdAt);
      if (!isNaN(parsed.getTime())) {
        createdAt = parsed.toISOString();
      }
    }

    const newAnnouncement: Announcement = {
      ...announcement,
      id: randomUUID(),
      createdAt,
    };
    announcements.unshift(newAnnouncement); // newest first
    try {
      console.log('Writing announcements to:', this.announcementsFile);
      await fs.writeFile(this.announcementsFile, JSON.stringify(announcements, null, 2), "utf-8");
    } catch (err) {
      console.error('Failed to write announcements file:', err);
      throw err;
    }
    return newAnnouncement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const announcements = await this.getAllAnnouncements();
    const filtered = announcements.filter(a => a.id !== id);
    await fs.writeFile(this.announcementsFile, JSON.stringify(filtered, null, 2), "utf-8");
  }

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.dataDir, this.electionsDir, this.votesDir, this.uploadsDir, this.exportsDir];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  private async readJsonFile<T>(filePath: string, schema: any): Promise<T[]> {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(item => schema.parse(item)) : [];
    } catch (error) {
      // File doesn't exist or is invalid, return empty array
      return [];
    }
  }

  private async writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  // User management
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const users = await this.readJsonFile<User>(this.usersFile, userSchema);
    return users.find(user => user.studentId === studentId);
  }

  // Added method to check for duplicate emails during signup
  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.readJsonFile<User>(this.usersFile, userSchema);
    return users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.readJsonFile<User>(this.usersFile, userSchema);

    // Check if user already exists by studentId
    if (users.find(u => u.studentId === insertUser.studentId)) {
      throw new Error("User with this student ID already exists");
    }
    // Check if user already exists by email
    if (await this.getUserByEmail(insertUser.email)) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
    const passwordHash = await bcrypt.hash(insertUser.password, saltRounds);

    const user: User = {
      studentId: insertUser.studentId,
      name: insertUser.name,
      email: insertUser.email,
      role: insertUser.role, // Default role will be handled in the service/API layer
      passwordHash,
      votedElections: {},
    };

    users.push(user);
    await this.writeJsonFile(this.usersFile, users);
    return user;
  }

  async updateUser(studentId: string, updates: Partial<User>): Promise<User> {
    const users = await this.readJsonFile<User>(this.usersFile, userSchema);
    const userIndex = users.findIndex(u => u.studentId === studentId);

    if (userIndex === -1) {
      throw new Error("User not found");
    }

    // Prevent changing role to admin from here (admin creation is manual)
    if (updates.role === 'admin' && users[userIndex].role !== 'admin') {
      throw new Error("Cannot change user role to admin via this endpoint");
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    await this.writeJsonFile(this.usersFile, users);
    return users[userIndex];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.readJsonFile<User>(this.usersFile, userSchema);
  }

  // Election management
  async getElection(id: string): Promise<Election | undefined> {
    // Handle both election_<id> and just <id> formats
    const fileName = id.startsWith('election_') ? `${id}.json` : `election_${id}.json`;
    const filePath = path.join(this.electionsDir, fileName);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return electionSchema.parse(JSON.parse(data));
    } catch (error) {
      return undefined;
    }
  }

  async getAllElections(): Promise<Election[]> {
    try {
      const files = await fs.readdir(this.electionsDir);
      const elections: Election[] = [];

      for (const file of files) {
        if (file.startsWith("election_") && file.endsWith(".json")) {
          const filePath = path.join(this.electionsDir, file);
          try {
            const data = await fs.readFile(filePath, "utf-8");
            elections.push(electionSchema.parse(JSON.parse(data)));
          } catch (error) {
            console.error(`Error reading election file ${file}:`, error);
          }
        }
      }

      return elections;
    } catch (error) {
      return [];
    }
  }

  async createElection(insertElection: InsertElection, createdBy: string): Promise<Election> {
    const id = `election_${randomUUID()}`;
    const election: Election = {
      ...insertElection,
      id,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const filePath = path.join(this.electionsDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(election, null, 2), "utf-8");
    return election;
  }

  async updateElection(id: string, updates: Partial<Election>): Promise<Election> {
    const election = await this.getElection(id);
    if (!election) {
      throw new Error("Election not found");
    }

    const updatedElection = { ...election, ...updates };
    // Handle both election_<id> and just <id> formats
    const fileName = id.startsWith('election_') ? `${id}.json` : `election_${id}.json`;
    const filePath = path.join(this.electionsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(updatedElection, null, 2), "utf-8");
    return updatedElection;
  }

  async deleteElection(id: string): Promise<void> {
    // Handle both election_<id> and just <id> formats
    const fileName = id.startsWith('election_') ? `${id}.json` : `election_${id}.json`;
    const filePath = path.join(this.electionsDir, fileName);
    await fs.unlink(filePath);
  }

  // Vote management
  async saveVote(vote: Vote, encryptedVoteData: string): Promise<string> {
    const voteId = randomUUID();
    const fileName = `vote_${vote.electionId}_${voteId}.enc`;
    const filePath = path.join(this.votesDir, fileName);

    await fs.writeFile(filePath, encryptedVoteData, "utf-8");
    return voteId;
  }

  async hasUserVoted(studentId: string, electionId: string): Promise<boolean> {
    const user = await this.getUserByStudentId(studentId);
    if (!user) return false;
    return user.votedElections[electionId]?.length > 0 || false;
  }

  async markUserVoted(studentId: string, electionId: string, positionIds: string[]): Promise<void> {
    const user = await this.getUserByStudentId(studentId);
    if (!user) {
      throw new Error("User not found");
    }

    user.votedElections[electionId] = positionIds;
    await this.updateUser(studentId, { votedElections: user.votedElections });
  }

  // Audit logging
  async logAudit(entry: AuditLogEntry): Promise<void> {
    const logLine = `${entry.timestamp} | ${entry.userId} | ${entry.action} | ${entry.details} | ip=${entry.ipAddress}\n`;
    await fs.appendFile(this.auditLogFile, logLine, "utf-8");
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    try {
      const data = await fs.readFile(this.auditLogFile, "utf-8");
      const lines = data.trim().split("\n").slice(-limit);

      return lines.map(line => {
        const parts = line.split(" | ");
        if (parts.length >= 5) {
          const ipMatch = parts[4].match(/ip=(.+)/);
          return auditLogEntrySchema.parse({
            timestamp: parts[0],
            userId: parts[1],
            action: parts[2],
            details: parts[3],
            ipAddress: ipMatch ? ipMatch[1] : "unknown",
          });
        }
        throw new Error("Invalid log line format");
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  // Results and exports
  async getElectionResults(electionId: string): Promise<ElectionResults | undefined> {
    const filePath = path.join(this.exportsDir, `results_${electionId}.json`);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return electionResultsSchema.parse(JSON.parse(data));
    } catch (error) {
      return undefined;
    }
  }

  async saveElectionResults(results: ElectionResults): Promise<void> {
    const filePath = path.join(this.exportsDir, `results_${results.electionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2), "utf-8");

    // Also generate CSV export as required by README
    await this.exportResultsToCSV(results);
  }

  async exportResultsToCSV(results: ElectionResults): Promise<string> {
    const csvFilePath = path.join(this.exportsDir, `results_${results.electionId}.csv`);

    // Generate standards-compliant CSV content
    const csvLines: string[] = [];

    // CSV Header row
    csvLines.push('Position,Candidate,Votes,Percentage,Election,Total_Votes,Eligible_Voters,Generated_At');

    // Data rows for each candidate in each position
    for (const position of results.results) {
      for (const candidate of position.candidates) {
        // Escape any commas or quotes in the data
        const escapedPositionTitle = this.escapeCSVField(position.positionTitle);
        const escapedCandidateName = this.escapeCSVField(candidate.candidateName);
        const escapedElectionTitle = this.escapeCSVField(results.title);

        csvLines.push(
          `${escapedPositionTitle},${escapedCandidateName},${candidate.voteCount},${candidate.percentage.toFixed(2)},${escapedElectionTitle},${results.totalVotes},${results.eligibleVoters},${results.generatedAt}`
        );
      }
    }

    const csvContent = csvLines.join('\n');
    await fs.writeFile(csvFilePath, csvContent, 'utf-8');

    return csvFilePath;
  }

  private escapeCSVField(field: string): string {
    // Escape fields containing commas, quotes, or newlines
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export const storage = new FileStorage();