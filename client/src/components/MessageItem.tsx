import { format } from "date-fns";
import { Message } from "../context/ChatContext";
import { Card, CardContent } from "@/components/ui/card";

interface MessageItemProps {
  message: Message;
  isMine: boolean;
}

export default function MessageItem({ message, isMine }: MessageItemProps) {
  const formattedTime = format(new Date(message.timestamp), "h:mm a");
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className={`flex items-end space-x-2 ${isMine ? "justify-end" : ""} message-animation`}>
      {!isMine && (
        <div 
          className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm ${
            // Use a consistent color based on the sender's name
            message.sender.charCodeAt(0) % 2 === 0 ? "bg-primary" : "bg-secondary"
          }`}
        >
          {getInitials(message.sender)}
        </div>
      )}
      <div className="max-w-xs md:max-w-md">
        <div className={`${
          isMine 
            ? "bg-primary text-white rounded-lg rounded-br-none" 
            : "bg-white rounded-lg rounded-bl-none"
          } px-4 py-2 shadow-sm`}
        >
          <p>{message.content}</p>
          
          {message.fileUrl && (
            message.fileType?.startsWith("image/") ? (
              <div className="mt-2 rounded-md overflow-hidden">
                <img src={message.fileUrl} alt="Uploaded" className="w-full h-auto" />
              </div>
            ) : (
              <div className="mt-2 bg-white bg-opacity-10 rounded-md p-3 flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{message.fileName}</p>
                  <p className="text-xs text-white text-opacity-70">
                    {message.fileSize} • {message.fileType?.split('/')[1].toUpperCase()}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
        <span className={`text-xs text-gray-500 ${isMine ? "flex justify-end mr-2" : "ml-2"}`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
