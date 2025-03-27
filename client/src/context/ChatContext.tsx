import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { chatSocket } from "../lib/socket";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  content: string;
  sender: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
}

interface ChatContextType {
  messages: Message[];
  users: User[];
  sendMessage: (content: string) => void;
  sendFileMessage: (file: File) => void;
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Register message handler
  useEffect(() => {
    if (!user) return;
    
    const removeMessageHandler = chatSocket.onMessage((message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Show toast for new messages from others
      if (message.sender !== user.username) {
        toast({
          title: `New message from ${message.sender}`,
          description: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : ''),
        });
      }
    });
    
    const removeUsersHandler = chatSocket.onUsersUpdate((updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });
    
    return () => {
      removeMessageHandler();
      removeUsersHandler();
    };
  }, [user, toast]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    chatSocket.sendMessage(content);
  };

  const sendFileMessage = async (file: File) => {
    try {
      await chatSocket.sendFile(file);
      
      // Show uploading toast
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error sending file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    }
  };

  return (
    <ChatContext.Provider value={{ messages, users, sendMessage, sendFileMessage }}>
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
