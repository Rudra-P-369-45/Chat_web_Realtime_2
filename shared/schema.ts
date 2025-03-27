import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  status: text("status").notNull().default('offline'),
  isOnline: boolean("is_online").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  status: true,
  isOnline: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  sender: text("sender").notNull(),
  timestamp: text("timestamp").notNull(), // Use text for timestamp to store ISO string
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  fileType: text("file_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create a customized insert schema with proper types
export const insertMessageSchema = z.object({
  content: z.string(),
  sender: z.string(),
  timestamp: z.string().or(z.date().transform(date => date.toISOString())),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.string().nullable().optional(),
  fileType: z.string().nullable().optional()
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// WebSocket message types
export type ChatEvent = {
  type: 'message' | 'userJoined' | 'userLeft' | 'usersList' | 'error';
  payload: any;
};
