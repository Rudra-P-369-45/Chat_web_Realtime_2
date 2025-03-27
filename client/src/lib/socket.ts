import { Message, User } from "../context/ChatContext";
import { ChatEvent } from "@shared/schema";

export class ChatSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private userHandlers: ((users: User[]) => void)[] = [];
  private isConnected = false;
  private username: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {}

  connect(username: string): void {
    this.username = username;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.sendJoinMessage();
      console.log("WebSocket connection established");
    };
    
    this.socket.onmessage = (event) => {
      try {
        console.log("Received message:", event.data);
        const chatEvent: ChatEvent = JSON.parse(event.data);
        this.handleSocketMessage(chatEvent);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    this.socket.onclose = (event) => {
      console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      this.isConnected = false;
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Maximum reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.username) {
        this.connect(this.username);
      }
    }, delay);
  }

  private sendJoinMessage(): void {
    if (this.socket && this.isConnected && this.username) {
      const joinEvent: ChatEvent = {
        type: "userJoined",
        payload: { username: this.username }
      };
      this.socket.send(JSON.stringify(joinEvent));
      console.log("Sent join message:", joinEvent);
    }
  }

  private handleSocketMessage(chatEvent: ChatEvent): void {
    console.log("Handling message:", chatEvent);
    switch (chatEvent.type) {
      case "message":
        this.messageHandlers.forEach(handler => handler(chatEvent.payload));
        break;
      case "usersList":
        this.userHandlers.forEach(handler => handler(chatEvent.payload.users));
        break;
      case "userJoined":
        // Handle when user joins successfully
        if (chatEvent.payload.recentMessages) {
          chatEvent.payload.recentMessages.forEach((message: Message) => {
            this.messageHandlers.forEach(handler => handler(message));
          });
        }
        if (chatEvent.payload.users) {
          this.userHandlers.forEach(handler => handler(chatEvent.payload.users));
        }
        break;
      case "error":
        console.error("WebSocket error from server:", chatEvent.payload.message);
        break;
    }
  }

  sendMessage(content: string): void {
    if (this.socket && this.isConnected && this.username) {
      const messageEvent: ChatEvent = {
        type: "message",
        payload: {
          content,
          sender: this.username,
          timestamp: new Date().toISOString()
        }
      };
      this.socket.send(JSON.stringify(messageEvent));
      console.log("Sent message:", messageEvent);
    }
  }

  async sendFile(file: File): Promise<void> {
    if (!this.isConnected || !this.username) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', this.username);

    try {
      console.log("Uploading file:", file.name);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      console.log("File uploaded successfully");
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onUsersUpdate(handler: (users: User[]) => void): () => void {
    this.userHandlers.push(handler);
    return () => {
      this.userHandlers = this.userHandlers.filter(h => h !== handler);
    };
  }
}

export const chatSocket = new ChatSocket();
