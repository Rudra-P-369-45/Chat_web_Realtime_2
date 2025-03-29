import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { chatSocket } from "../lib/socket";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface User {
  username: string;
  uid: string;
  email?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        // User is signed in
        const userObj: User = {
          uid: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || undefined,
          photoURL: firebaseUser.photoURL || undefined
        };
        setUser(userObj);
        
        // Connect to socket with username
        chatSocket.connect(userObj.username);
      } else {
        // User is signed out
        setUser(null);
        chatSocket.disconnect();
      }
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Helper function to create a fixed email from username
  const createEmailFromUsername = (username: string): string => {
    return `${username.replace(/[^a-zA-Z0-9]/g, '')}@rudrachats.com`;
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const email = createEmailFromUsername(username);
      
      try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        // If sign in fails, create a new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with username as displayName
        await updateProfile(userCredential.user, {
          displayName: username
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket
      chatSocket.disconnect();
      
      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      isLoading 
    }}>
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
