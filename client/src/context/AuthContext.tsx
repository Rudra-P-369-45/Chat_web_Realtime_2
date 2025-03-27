import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { chatSocket } from "../lib/socket";

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Reconnect socket with saved username
      chatSocket.connect(parsedUser.username);
    }
  }, []);

  const login = (username: string) => {
    const newUser = { username };
    setUser(newUser);
    
    // Store user in localStorage
    localStorage.setItem("chatUser", JSON.stringify(newUser));
    
    // Connect to socket
    chatSocket.connect(username);
  };

  const logout = () => {
    // Disconnect socket
    chatSocket.disconnect();
    
    // Clear user from state and localStorage
    setUser(null);
    localStorage.removeItem("chatUser");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
