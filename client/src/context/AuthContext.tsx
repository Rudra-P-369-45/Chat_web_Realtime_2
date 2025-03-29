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
import { auth, isUsernameOnline } from "../lib/firebase";
import { useToast } from "../hooks/use-toast";

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
  const { toast } = useToast();
  
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
      // First check if the username is already in use by an online user
      const usernameInUse = await isUsernameOnline(username);
      
      if (usernameInUse) {
        toast({
          title: "Username already in use",
          description: "This username is currently being used by another online user. Please try a different username.",
          variant: "destructive",
        });
        throw new Error("Username already in use");
      }
      
      // To handle the case where Firebase Authentication is not fully set up yet,
      // we'll implement a fallback to the previous localStorage approach
      try {
        const email = createEmailFromUsername(username);
        
        try {
          // Try to sign in first
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError: any) {
          // Only create a new user if the error is user-not-found
          if (signInError.code === 'auth/user-not-found') {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with username as displayName
            await updateProfile(userCredential.user, {
              displayName: username
            });
          } else {
            throw signInError;
          }
        }
      } catch (firebaseError: any) {
        // If Firebase auth fails with configuration error, use localStorage fallback
        if (firebaseError.code === 'auth/configuration-not-found' || 
            firebaseError.code === 'auth/operation-not-allowed') {
          console.warn("Using localStorage fallback for authentication");
          
          // Create user object and store in localStorage as fallback
          const fallbackUser: User = { 
            username, 
            uid: `local-${Date.now()}` 
          };
          localStorage.setItem("chatUser", JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          return;
        } else {
          throw firebaseError;
        }
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
      
      // Clear user from localStorage (for fallback authentication)
      localStorage.removeItem("chatUser");
      
      try {
        // Sign out from Firebase
        await signOut(auth);
      } catch (error) {
        console.warn("Firebase sign out failed, using fallback", error);
      }
      
      // Ensure user state is cleared even if Firebase signOut fails
      setUser(null);
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
