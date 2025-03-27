export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

export interface ChatMessage {
  content: string;
  sender: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}

export interface SocketMessage {
  type: 'message' | 'file' | 'user_joined' | 'user_left' | 'users_list';
  data: any;
}
