import { create } from 'zustand';
import { Message, User } from '../types';
import { apiRequest } from '@/lib/queryClient';

interface ChatState {
  currentUser: User | null;
  onlineUsers: User[];
  messages: Message[];
  isAuthenticated: boolean;
  
  setCurrentUser: (user: User | null) => void;
  setOnlineUsers: (users: User[]) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentUser: null,
  onlineUsers: [],
  messages: [],
  isAuthenticated: false,

  setCurrentUser: (user) => set({ 
    currentUser: user,
    isAuthenticated: !!user
  }),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addMessage: (message) => set(state => ({ 
    messages: [...state.messages, message] 
  })),
  
  setMessages: (messages) => set({ messages }),
  
  login: async (username, password) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      if (data.user) {
        set({ 
          currentUser: data.user,
          isAuthenticated: true
        });
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },
  
  logout: async () => {
    const { currentUser } = get();
    
    // Reset store state
    set({ 
      currentUser: null,
      isAuthenticated: false
    });
    
    // Attempt to notify server (but don't wait for it if user is already disconnected)
    if (currentUser) {
      try {
        // This is a fire-and-forget operation, we don't need to wait for it
        apiRequest('POST', '/api/auth/logout', { username: currentUser.username })
          .catch(err => console.log('Logout notification failed, but user logged out locally.'));
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  }
}));
