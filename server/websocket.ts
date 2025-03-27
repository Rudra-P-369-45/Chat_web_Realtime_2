import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { ChatEvent, Message, User } from '@shared/schema';

type ConnectedClient = {
  socket: WebSocket;
  username: string;
  userId: number;
};

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (socket: WebSocket) => {
      // Handle new connection
      console.log('New WebSocket connection established');

      // Setup event listeners
      socket.on('message', async (data: string) => {
        try {
          const event: ChatEvent = JSON.parse(data);
          await this.handleEvent(socket, event);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendToClient(socket, {
            type: 'error',
            payload: { message: 'Invalid message format' }
          });
        }
      });

      socket.on('close', () => {
        this.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleEvent(socket: WebSocket, event: ChatEvent) {
    switch (event.type) {
      case 'userJoined':
        await this.handleUserJoined(socket, event.payload);
        break;
      case 'message':
        await this.handleMessage(event.payload);
        break;
      case 'userLeft':
        await this.handleUserLeft(event.payload.username);
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }
  }

  private async handleUserJoined(socket: WebSocket, payload: { username: string, userId: number }) {
    const { username, userId } = payload;
    
    // Store client connection
    this.clients.set(username, { socket, username, userId });
    
    // Update user status in storage
    await storage.setUserOnlineStatus(username, true);
    
    // Get recent messages
    const recentMessages = await storage.getRecentMessages(50);
    
    // Send welcome message to the client
    this.sendToClient(socket, {
      type: 'userJoined',
      payload: { 
        success: true,
        message: `Welcome to the chat, ${username}!`,
        recentMessages,
        users: await this.getOnlineUsers()
      }
    });
    
    // Broadcast to all clients that a new user has joined
    this.broadcast({
      type: 'usersList',
      payload: { 
        users: await this.getOnlineUsers(),
        systemMessage: `${username} has joined the chat.`
      }
    }, username);
  }

  private async handleMessage(payload: { 
    senderId: number, 
    content: string, 
    fileName?: string, 
    fileSize?: number,
    fileType?: string,
    fileData?: string
  }) {
    // Store message in database
    const message = await storage.storeMessage(payload);
    
    // Broadcast message to all clients
    this.broadcast({
      type: 'message',
      payload: message
    });
  }

  private async handleUserLeft(username: string) {
    if (username) {
      // Update user status in storage
      await storage.setUserOnlineStatus(username, false);
      
      // Remove client from connected clients
      this.clients.delete(username);
      
      // Broadcast to all clients that a user has left
      this.broadcast({
        type: 'usersList',
        payload: { 
          users: await this.getOnlineUsers(),
          systemMessage: `${username} has left the chat.`
        }
      });
    }
  }

  private handleDisconnect(socket: WebSocket) {
    // Find the disconnected client
    const disconnectedClient = Array.from(this.clients.values()).find(
      client => client.socket === socket
    );
    
    if (disconnectedClient) {
      this.handleUserLeft(disconnectedClient.username);
    }
  }

  private async getOnlineUsers(): Promise<User[]> {
    const allUsers = await storage.getAllUsers();
    return allUsers.filter(user => user.online);
  }

  private sendToClient(socket: WebSocket, event: ChatEvent) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  }

  private broadcast(event: ChatEvent, excludeUsername?: string) {
    this.clients.forEach((client) => {
      if (!excludeUsername || client.username !== excludeUsername) {
        this.sendToClient(client.socket, event);
      }
    });
  }
}
