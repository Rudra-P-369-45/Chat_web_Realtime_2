import { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { Button } from "@/components/ui/button";
import { chatSocket } from "../lib/socket";
import { Trash2 } from "lucide-react";

export default function Header() {
  const [username, setUsername] = useState("");
  const { users, clearMessages } = useChat();
  
  const onlineCount = users.filter(u => u.isOnline).length;

  useEffect(() => {
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUsername(parsedUser.username);
    }
  }, []);

  const handleLogout = () => {
    // Disconnect socket
    chatSocket.disconnect();
    
    // Clear user from localStorage
    localStorage.removeItem("chatUser");
    
    // Redirect to login
    window.location.href = "/login";
  };

  return (
    <header className="bg-primary text-white shadow px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold">RealChat</h1>
        <div className="bg-green-400 rounded-full h-2.5 w-2.5"></div>
        <span className="text-sm font-medium">{onlineCount} online</span>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium">{username}</span>
        <Button 
          onClick={clearMessages}
          variant="outline"
          size="sm"
          className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear Chat
        </Button>
        <Button 
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
