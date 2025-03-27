export type User = {
  id: number;
  username: string;
  online?: boolean;
  lastSeen?: Date;
};

export type Message = {
  id: number;
  senderId: number;
  content: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: string;
  timestamp: Date;
};

export type ChatEvent = {
  type: 'message' | 'userJoined' | 'userLeft' | 'usersList' | 'error';
  payload: any;
};

export type UploadPreviewType = {
  file: File | null;
  preview: string | null;
};
