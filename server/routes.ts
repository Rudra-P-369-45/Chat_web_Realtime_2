import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { uploadMiddleware } from "./multer";
import path from "path";
import fs from "fs";
import { UserStatus } from "./chat";
import { ChatEvent } from "@shared/schema";

// Extend Request for multer
import { Request } from "express";
interface FileRequest extends Request {
  file?: {
    filename: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}

interface SocketConnection {
  socket: WebSocket;
  username: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create the WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log("WebSocket server initialized on path /ws");
  
  // Store active connections
  const connections: SocketConnection[] = [];
  
  // Handle WebSocket connections
  wss.on('connection', (socket) => {
    console.log("New WebSocket connection established");
    let username = "";
    
    socket.on('message', async (message) => {
      try {
        console.log("Received message:", message.toString());
        const chatEvent: ChatEvent = JSON.parse(message.toString());
        
        switch (chatEvent.type) {
          case 'userJoined':
            username = chatEvent.payload.username || "";
            console.log(`User joined: ${username}`);
            
            if (!username) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Username is required' }
              }));
              return;
            }
            
            // Create or get user
            const user = await storage.getOrCreateUser(username);
            
            // Add to connections
            connections.push({ socket, username });
            
            // Update user status
            await storage.setUserOnlineStatus(username, true);
            
            // Get recent messages
            const recentMessages = await storage.getRecentMessages(50);
            const allUsers = await storage.getAllUsers();
            
            // Send welcome response to the user who joined
            socket.send(JSON.stringify({
              type: 'userJoined',
              payload: {
                success: true,
                message: `Welcome to the chat, ${username}!`,
                recentMessages,
                users: allUsers.filter(u => u.isOnline)
              }
            }));
            
            // Broadcast user joined to others
            const joinedEvent: ChatEvent = {
              type: 'usersList',
              payload: {
                users: allUsers.filter(u => u.isOnline),
                systemMessage: `${username} has joined the chat.`
              }
            };
            
            broadcastEvent(joinedEvent, username);
            
            // Save system message to storage
            await storage.saveMessage({
              content: `${username} has joined the chat`,
              sender: "System",
              timestamp: new Date().toISOString(),
              fileUrl: null,
              fileName: null,
              fileSize: null,
              fileType: null
            });
            break;
            
          case 'message':
            if (!username) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'You must be logged in to send messages' }
              }));
              break;
            }
            
            console.log(`Message from ${username}: ${chatEvent.payload.content}`);
            
            const messageData = {
              content: chatEvent.payload.content,
              sender: username,
              timestamp: new Date().toISOString(),
              fileUrl: null,
              fileName: null,
              fileSize: null,
              fileType: null
            };
            
            // Save message
            const savedMessage = await storage.saveMessage(messageData);
            
            // Broadcast to all clients
            broadcastEvent({
              type: 'message',
              payload: savedMessage
            });
            break;
            
          default:
            console.log(`Unknown event type: ${chatEvent.type}`);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        socket.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Error processing message' }
        }));
      }
    });
    
    socket.on('close', async () => {
      if (username) {
        console.log(`User disconnected: ${username}`);
        
        // Remove from connections
        const index = connections.findIndex(conn => conn.username === username);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        
        // Update user status
        await storage.setUserOnlineStatus(username, false);
        
        // Save system message
        await storage.saveMessage({
          content: `${username} has left the chat`,
          sender: "System",
          timestamp: new Date().toISOString(),
          fileUrl: null,
          fileName: null,
          fileSize: null,
          fileType: null
        });
        
        // Broadcast updated user list
        const allUsers = await storage.getAllUsers();
        broadcastEvent({
          type: 'usersList',
          payload: {
            users: allUsers.filter(u => u.isOnline),
            systemMessage: `${username} has left the chat.`
          }
        });
      }
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Function to broadcast events to all connected clients
  function broadcastEvent(event: ChatEvent, excludeUsername?: string) {
    const eventStr = JSON.stringify(event);
    
    console.log(`Broadcasting event: ${event.type}`, 
      excludeUsername ? `(excluding ${excludeUsername})` : '');
    
    connections.forEach(({ socket, username }) => {
      if (socket.readyState === WebSocket.OPEN && (!excludeUsername || username !== excludeUsername)) {
        socket.send(eventStr);
      }
    });
  }
  
  // File upload route
  app.post('/api/upload', uploadMiddleware.single('file'), async (req: FileRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }
      
      console.log(`File upload from ${username}: ${req.file.originalname}`);
      
      // Get file information
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileName = req.file.originalname;
      const fileSize = formatFileSize(req.file.size);
      const fileType = req.file.mimetype;
      
      // Create file message
      const fileMessage = {
        content: `Shared a file: ${fileName}`,
        sender: username as string,
        timestamp: new Date().toISOString(),
        fileUrl,
        fileName,
        fileSize,
        fileType
      };
      
      // Save message
      const savedMessage = await storage.saveMessage(fileMessage);
      
      // Broadcast message
      broadcastEvent({
        type: 'message',
        payload: savedMessage
      });
      
      res.status(200).json({ message: 'File uploaded successfully', fileUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  });
  
  return httpServer;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}
