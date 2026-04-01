
// This file is auto-generated from docs/backend.json. Do not edit manually.

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: "Student" | "Professor" | "Associate Professor" | "Assistant Professor";
  department: string;
  bio: string;
  isFollowing?: boolean;
  isRestricted?: boolean;
  restrictedAt?: string;
  chatRetentionUntil?: string;
}

export interface Post {
  id: number;
  authorId: string;
  content: string;
  image?: string;
  likes: number;
  createdAt: string; // Should be a valid ISO 8601 date string
  // The following fields are for frontend state and not in the backend schema
  author: string;
  role: string;
  avatar: string;
  time: string;
  comments: Comment[];
  isLiked?: boolean;
  imageHint?: string;
}

export interface Comment {
  id: number;
  authorId: string;
  text: string;
  likes: number;
  // The following fields are for frontend state and not in the backend schema
  author: string;
  avatar: string;
  isLiked?: boolean;
}

export interface Chat {
  id: string;
  userIds: string[];
  isGroup: boolean;
  name?: string;
  groupAvatar?: string;
  adminIds?: string[];
  // The following fields are for frontend state and not in the backend schema
  users: User[];
  messages: Message[];
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string; // Should be a valid ISO 8601 date string
  sharedPostId?: number;
  sharedNoteId?: number;
  replyToId?: string;
  isDeleted?: boolean;
  // The following fields are for frontend state and not in the backend schema
  sharedPost?: Post;
  sharedNote?: Note;
  sharedReel?: Reel;
  media?: MediaAttachment[];
  audioUrl?: string;
  reactions?: Reaction[];
  isSystem?: boolean;
}

export interface MediaAttachment {
  type: string;
  url: string;
  fileName?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface Note {
  id: number;
  title: string;
  description?: string;
  authorId: string;
  date: string; // Should be a valid ISO 8601 date string
  course: "btech-eng" | "bsc";
  branch: string;
  year: string;
  subject: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  // The following fields are for frontend state and not in the backend schema
  author: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  uploaderId: string;
  createdAt: string; // Should be a valid ISO 8601 date string
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  url: string;
  uploaderId: string;
  postedAt: string; // Should be a valid ISO 8601 date string
}

export interface Registration {
  id: string;
  studentName: string;
  studentId: string;
  group: string;
  status: "Pending" | "Approved" | "Denied";
  submittedAt: string; // Should be a valid ISO 8601 date string
}

export interface Reel {
  id: number;
  authorId: string;
  videoUrl: string;
  caption?: string;
  likes: number;
  createdAt: string; // Should be a valid ISO 8601 date string
  // The following fields are for frontend state and not in the backend schema
  author: string;
  avatar: string;
  isLiked: boolean;
  comments: Comment[];
}

export interface AppNotification {
  id: string;
  type:
    | 'post'
    | 'comment'
    | 'message'
    | 'like'
    | 'reel'
    | 'notice'
    | 'schedule'
    | 'note'
    | 'internship';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string;
  actor: {
    name: string;
    avatar: string;
  };
}
