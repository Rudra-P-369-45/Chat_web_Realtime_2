import React from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '../store/chatStore';

interface ChatHeaderProps {
  onlineCount: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onlineCount }) => {
  const currentUser = useChatStore(state => state.currentUser);
  const logout = useChatStore(state => state.logout);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-primary text-white shadow px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold">RealChat</h1>
        <div className="bg-green-400 rounded-full h-2.5 w-2.5"></div>
        <span className="text-sm font-medium">{onlineCount} online</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">{currentUser?.username}</span>
        <Button 
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        >
          Logout
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
