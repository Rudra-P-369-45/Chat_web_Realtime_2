import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, User } from '../types';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  users: User[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, users }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const getUserById = (id: number): User | undefined => {
    return users.find(user => user.id === id);
  };

  const getUserInitials = (username: string): string => {
    return username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatMessageTime = (timestamp: Date): string => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const getRandomColor = (username: string): string => {
    const colors = ['primary', 'secondary', 'blue-500', 'green-500', 'purple-500', 'pink-500'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const renderFilePreview = (message: Message) => {
    if (!message.fileName) return null;

    const isImage = message.fileType?.startsWith('image/');

    if (isImage && message.fileData) {
      return (
        <div className="mt-2 rounded-md overflow-hidden">
          <img 
            src={`data:${message.fileType};base64,${message.fileData}`}
            alt={message.fileName}
            className="max-w-full h-auto rounded"
          />
        </div>
      );
    } else {
      return (
        <div className="mt-2 bg-white bg-opacity-10 rounded-md p-3 flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 h-10 w-10 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">{message.fileName}</p>
            <p className="text-xs text-white text-opacity-70">
              {formatFileSize(message.fileSize)} • {message.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
            </p>
          </div>
        </div>
      );
    }
  };

  // Group messages by date for date separators
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <ScrollArea className="flex-1 p-4 custom-scrollbar">
      <div className="flex flex-col space-y-4">
        {/* System welcome message */}
        <div className="flex justify-center">
          <div className="bg-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm">
            Welcome to the chat!
          </div>
        </div>
        
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <React.Fragment key={date}>
            {/* Date separator */}
            <div className="flex justify-center">
              <div className="bg-gray-200 text-gray-600 rounded-full px-4 py-2 text-xs font-medium">
                {format(new Date(date), 'MMMM d, yyyy')}
              </div>
            </div>
            
            {/* Messages for this date */}
            {msgs.map((message) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const sender = getUserById(message.senderId);
              
              if (isCurrentUser) {
                return (
                  <div key={message.id} className="flex items-end justify-end space-x-2 message-animation">
                    <div className="max-w-xs md:max-w-md">
                      <div className="bg-primary text-white rounded-lg rounded-br-none px-4 py-2 shadow-sm">
                        <p>{message.content}</p>
                        {renderFilePreview(message)}
                      </div>
                      <span className="text-xs text-gray-500 flex justify-end mr-2">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={message.id} className="flex items-end space-x-2 message-animation">
                    <div className={`h-8 w-8 rounded-full bg-${getRandomColor(sender?.username || 'user')} flex items-center justify-center text-white text-sm`}>
                      {getUserInitials(sender?.username || 'U')}
                    </div>
                    <div className="max-w-xs md:max-w-md">
                      <div className="bg-white rounded-lg rounded-bl-none px-4 py-2 shadow-sm">
                        <p className="text-gray-800">{message.content}</p>
                        {renderFilePreview(message)}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </React.Fragment>
        ))}
        
        {/* Auto-scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
