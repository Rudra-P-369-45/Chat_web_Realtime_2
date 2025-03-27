import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout } = useAuth();
  const { users } = useChat();
  
  const onlineCount = users.filter(u => u.isOnline).length;

  return (
    <header className="bg-primary text-white shadow px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold">RealChat</h1>
        <div className="bg-green-400 rounded-full h-2.5 w-2.5"></div>
        <span className="text-sm font-medium">{onlineCount} online</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">{user?.username}</span>
        <Button 
          onClick={logout}
          variant="outline"
          className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
