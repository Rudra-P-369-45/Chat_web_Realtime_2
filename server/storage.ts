import { users, messages, type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { UserStatus } from "./chat";
import { db } from "./db";
import { eq, desc, asc, and, like } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getOrCreateUser(username: string): Promise<User>;
  updateUserStatus(username: string, status: UserStatus): Promise<User | undefined>;
  setUserOnlineStatus(username: string, isOnline: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  saveMessage(message: InsertMessage): Promise<Message>;
  storeMessage(messageData: any): Promise<Message>;
  getRecentMessages(limit: number): Promise<Message[]>;
}

// Implementation using PostgreSQL database
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async getOrCreateUser(username: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      // Update to online
      return this.setUserOnlineStatus(username, true) as Promise<User>;
    }

    // Create new user
    const [newUser] = await db.insert(users)
      .values({
        username,
        status: UserStatus.ONLINE,
        isOnline: true
      })
      .returning();
    
    console.log(`Created new user: ${username} (ID: ${newUser.id})`);
    return newUser;
  }

  async updateUserStatus(username: string, status: UserStatus): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    const [updatedUser] = await db.update(users)
      .set({
        status,
        isOnline: status === UserStatus.ONLINE
      })
      .where(eq(users.username, username))
      .returning();

    console.log(`Updated user status: ${username} (Status: ${status})`);
    return updatedUser;
  }

  async setUserOnlineStatus(username: string, isOnline: boolean): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    const status = isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE;
    
    const [updatedUser] = await db.update(users)
      .set({
        status,
        isOnline
      })
      .where(eq(users.username, username))
      .returning();

    console.log(`Set user online status: ${username} (Online: ${isOnline})`);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async saveMessage(messageData: InsertMessage): Promise<Message> {
    // Ensure timestamp is a string
    let timestamp = typeof messageData.timestamp === 'string' 
      ? messageData.timestamp 
      : new Date().toISOString();

    const [message] = await db.insert(messages)
      .values({
        content: messageData.content,
        sender: messageData.sender,
        timestamp,
        fileUrl: messageData.fileUrl || null,
        fileName: messageData.fileName || null,
        fileSize: messageData.fileSize || null,
        fileType: messageData.fileType || null
      })
      .returning();

    console.log(`Saved message: ${message.sender}: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`);
    return message;
  }

  // This is used by the websocket handler to store messages
  async storeMessage(messageData: any): Promise<Message> {
    // Convert any Date-like objects to ISO strings
    if (messageData.timestamp && typeof messageData.timestamp === 'object') {
      messageData.timestamp = new Date(messageData.timestamp).toISOString();
    } else if (!messageData.timestamp) {
      messageData.timestamp = new Date().toISOString();
    }
    
    return this.saveMessage(messageData);
  }

  async getRecentMessages(limit: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .orderBy(asc(messages.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
