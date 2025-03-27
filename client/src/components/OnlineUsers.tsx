import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '../types';

interface OnlineUsersProps {
  users: User[];
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users }) => {
  const getUserInitials = (username: string): string => {
    return username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (username: string): string => {
    const colors = ['primary', 'secondary', 'blue-500', 'green-500', 'purple-500', 'pink-500'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">Online Friends</h2>
      </div>
      <ScrollArea className="p-3 flex-1">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
            <div className="relative">
              <div className={`h-10 w-10 rounded-full bg-${getRandomColor(user.username)} flex items-center justify-center text-white font-medium`}>
                {getUserInitials(user.username)}
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="font-medium text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No users online yet
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};

export default OnlineUsers;
