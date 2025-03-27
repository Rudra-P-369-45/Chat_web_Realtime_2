interface OnlineUserProps {
  username: string;
  isOnline: boolean;
}

export default function OnlineUser({ username, isOnline }: OnlineUserProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getBackgroundColor = () => {
    // Use a consistent color based on the username
    return username.charCodeAt(0) % 2 === 0 ? "bg-primary" : "bg-secondary";
  };

  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
      <div className="relative">
        <div 
          className={`h-10 w-10 rounded-full ${getBackgroundColor()} flex items-center justify-center text-white font-medium`}
        >
          {getInitials(username)}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div>
        <p className="font-medium text-gray-800">{username}</p>
        <p className="text-xs text-gray-500">{isOnline ? "Active now" : "Offline"}</p>
      </div>
    </div>
  );
}
