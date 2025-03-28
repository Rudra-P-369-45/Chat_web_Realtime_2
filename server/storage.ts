import { users, messages, type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { UserStatus } from "./chat";

// modify the interface with any CRUD methods
// you might need

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getOrCreateUser(username: string): Promise<User> {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      // Update to online
      return this.setUserOnlineStatus(username, true) as Promise<User>;
    }

    // Create new user
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      id, 
      username, 
      status: UserStatus.ONLINE,
      isOnline: true,
      createdAt: now
    };
    
    this.users.set(id, user);
    console.log(`Created new user: ${username} (ID: ${id})`);
    return user;
  }

  async updateUserStatus(username: string, status: UserStatus): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      status,
      isOnline: status === UserStatus.ONLINE
    };

    this.users.set(user.id, updatedUser);
    console.log(`Updated user status: ${username} (Status: ${status})`);
    return updatedUser;
  }

  async setUserOnlineStatus(username: string, isOnline: boolean): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    const status = isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE;
    const updatedUser: User = {
      ...user,
      status,
      isOnline
    };

    this.users.set(user.id, updatedUser);
    console.log(`Set user online status: ${username} (Online: ${isOnline})`);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async saveMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    
    // Ensure timestamp is a string
    let timestamp = typeof messageData.timestamp === 'string' 
      ? messageData.timestamp 
      : new Date().toISOString();
    
    const message: Message = { 
      id, 
      content: messageData.content,
      sender: messageData.sender,
      timestamp,
      fileUrl: messageData.fileUrl || null,
      fileName: messageData.fileName || null,
      fileSize: messageData.fileSize || null,
      fileType: messageData.fileType || null,
      createdAt: new Date()
    };
    
    this.messages.set(id, message);
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
    const allMessages = Array.from(this.messages.values());
    
    // Sort by timestamp
    allMessages.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Get the most recent messages
    return allMessages.slice(-limit);
  }
}

export const storage = new MemStorage();
