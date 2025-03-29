import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import { db, storage } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp, 
  getDocs,
  where,
  updateDoc,
  doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export interface Message {
  id?: string;
  content: string;
  sender: string;
  senderUid?: string;
  timestamp: string | Timestamp;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export interface User {
  id: string;        // Firestore document ID
  userId: string;    // Firebase Auth UID
  username: string;
  isOnline: boolean;
  lastSeen?: Timestamp;
  photoURL?: string;
}

interface ChatContextType {
  messages: Message[];
  users: User[];
  sendMessage: (content: string) => Promise<void>;
  sendFileMessage: (file: File) => Promise<void>;
  clearMessages: () => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Format file size for display
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Listen for messages from Firestore
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    
    // Set the current user as online
    updateUserStatus(user.uid, true);
    
    // Query messages
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );

    // Subscribe to messages
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        messageList.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp as Timestamp,
        });
      });
      setMessages(messageList);
      setIsLoading(false);
    });

    // Subscribe to users online status
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const userList: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const userObj: User = {
          id: doc.id,
          userId: data.userId || '',
          username: data.username || 'Unknown',
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen,
          photoURL: data.photoURL
        };
        userList.push(userObj);
      });
      setUsers(userList);
    });

    // Set up beforeunload event to mark user as offline when leaving
    const handleBeforeUnload = () => {
      updateUserStatus(user.uid, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserStatus(user.uid, false);
    };
  }, [user]);

  // Update user online status
  const updateUserStatus = async (uid: string, isOnline: boolean) => {
    if (!uid) return;
    
    try {
      // Check if user exists in the users collection
      const userQuery = query(collection(db, "users"), where("userId", "==", uid));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty && user) {
        // Create user if doesn't exist
        await addDoc(collection(db, "users"), {
          userId: uid, // Changed from id to userId to avoid duplicate property
          username: user.username,
          isOnline: isOnline,
          lastSeen: serverTimestamp(),
          photoURL: user.photoURL,
        });
      } else {
        // Update existing user
        userSnapshot.forEach(async (document) => {
          await updateDoc(doc(db, "users", document.id), {
            isOnline: isOnline,
            lastSeen: serverTimestamp(),
          });
        });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;
    
    try {
      await addDoc(collection(db, "messages"), {
        content: content,
        sender: user.username,
        senderUid: user.uid,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const sendFileMessage = async (file: File) => {
    if (!file || !user) return;
    
    try {
      // Create storage reference
      const storageRef = ref(storage, `chat-files/${Date.now()}_${file.name}`);
      
      // Upload file to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Show uploading toast
      const uploadingToast = toast({
        title: "Uploading file...",
        description: "Please wait while your file is being uploaded.",
      });
      
      // Listen for upload progress
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          // Handle progress updates if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle error
          console.error("Error uploading file:", error);
          toast({
            title: "Upload failed",
            description: "There was an error uploading your file.",
            variant: "destructive",
          });
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Add message with file info to Firestore
          await addDoc(collection(db, "messages"), {
            content: `Sent a file: ${file.name}`,
            sender: user.username,
            senderUid: user.uid,
            timestamp: serverTimestamp(),
            fileUrl: downloadURL,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileType: file.type,
          });
          
          // Close the uploading toast and show success toast
          toast({
            title: "File uploaded",
            description: `${file.name} has been uploaded successfully.`,
          });
        }
      );
    } catch (error) {
      console.error("Error sending file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    }
  };

  const clearMessages = () => {
    // Filter out system messages
    const systemMessages = messages.filter(msg => 
      msg.sender === "System" && 
      (msg.content.includes("has joined the chat") || msg.content.includes("has left the chat"))
    );
    
    // Update the UI immediately
    setMessages(systemMessages);
    
    toast({
      title: "Chat cleared",
      description: "Your chat history has been cleared locally.",
    });
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      users, 
      sendMessage, 
      sendFileMessage, 
      clearMessages,
      isLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
