export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing' | 'away';
  lastSeen?: string;
  role: string; // Dynamic persona for Gemini (e.g. "صديق مقرب", "مدير العمل", "أختي الكبرى", "طبيب العائلة")
  bio?: string;
  isGroup: boolean;
  members?: string[]; // Contact IDs in the group
  visibility?: 'public' | 'hidden'; // Contact visibility status
}

export interface Message {
  id: string;
  senderId: string; // 'me' or Contact ID
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice' | 'file' | 'video';
  mediaUrl?: string;
  duration?: number; // for voice note duration in seconds
  fileName?: string;
  fileSize?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface CallRecord {
  id: string;
  contactId: string;
  type: 'video' | 'audio';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string; // formatted duration e.g. "12:34"
}

export interface CallState {
  status: 'idle' | 'ringing_outgoing' | 'ringing_incoming' | 'connected' | 'ended';
  contact: Contact | null;
  type: 'video' | 'audio';
  duration: number; // call duration in seconds
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface MessageReminder {
  id: string;
  messageId: string;
  messageText: string;
  senderName: string;
  remindAt: number; // timestamp in ms
  triggered: boolean;
}

