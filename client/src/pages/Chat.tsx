import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import MessageItem from "../components/MessageItem"; 
import OnlineUser from "../components/OnlineUser";
import FileUploadPreview from "../components/FileUploadPreview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Trash2 } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentUser, setCurrentUser] = useState<{username: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, users, sendMessage, sendFileMessage, clearMessages } = useChat();
  const { toast } = useToast();

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Resize textarea as user types
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFile) {
      sendFileMessage(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
      // Reset textarea height
      const textarea = document.getElementById("message-input") as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = "48px";
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    window.location.href = "/login";
  };

  return (
    <div className="h-screen flex flex-col bg-light">
      <Header />
      
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Online users sidebar (visible on larger screens) */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">Online Friends</h2>
          </div>
          <ScrollArea className="flex-1 p-3">
            {users.map((u) => (
              <OnlineUser 
                key={u.id} 
                username={u.username} 
                isOnline={u.isOnline} 
              />
            ))}
          </ScrollArea>
        </aside>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Messages container with clear button */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-white">
            <div className="text-sm text-gray-500">
              {messages.length > 0 ? `${messages.length} messages` : 'No messages'}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={clearMessages}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4" type="always">
            <div className="flex flex-col space-y-4">
              {/* Welcome message */}
              <div className="flex justify-center">
                <div className="bg-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm">
                  Welcome to the chat!
                </div>
              </div>
              
              {messages.map((msg, index) => (
                <MessageItem
                  key={index}
                  message={msg}
                  isMine={msg.sender === currentUser?.username}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Message input area */}
          <div className="border-t border-gray-200 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
              <div className="relative flex-1">
                <Textarea
                  id="message-input"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Type your message..."
                  className="resize-none border border-gray-300 rounded-lg pl-4 pr-12 py-3 h-12 max-h-32"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-3 bottom-3 text-gray-500 hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <Button type="submit" className="bg-primary text-white">
                <Send className="h-5 w-5" />
              </Button>
            </form>
            
            {/* File upload preview */}
            {selectedFile && (
              <FileUploadPreview 
                file={selectedFile} 
                onCancel={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
