// Chat Room types
export interface ChatRoom {
  id: string;
  name: string;
  creator: string;
  created_at: number;
  message_count: number;
}

// Message types
export interface Message {
  id: string;
  room_id: string;
  sender: string;
  content_walrus_blob_id: string;
  message_type: number;
  timestamp: number;
  read_count: number;
  // Local fields (not from blockchain)
  content?: string; // Fetched from Walrus
  senderName?: string;
  senderAvatar?: string;
  isRead?: boolean;
}

// User Profile types
export interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  avatar_walrus_blob_id: string;
  created_at: number;
  last_seen: number;
  // Local fields
  avatar_url?: string; // Fetched from Walrus
  lastMessageTime?: number; // Timestamp of user's most recent message
}

// Event types
export interface RoomCreatedEvent {
  room_id: string;
  name: string;
  creator: string;
  timestamp: number;
}

export interface MessageSentEvent {
  message_id: string;
  room_id: string;
  sender: string;
  content_blob_id: string;
  message_type: number;
  timestamp: number;
}

export interface MessageReadEvent {
  message_id: string;
  reader: string;
  timestamp: number;
}

export interface TypingEvent {
  room_id: string;
  user: string;
  is_typing: boolean;
  timestamp: number;
}

export interface ProfileCreatedEvent {
  profile_id: string;
  wallet_address: string;
  username: string;
  timestamp: number;
}

export interface ProfileUpdatedEvent {
  profile_id: string;
  wallet_address: string;
  field: string;
  timestamp: number;
}
