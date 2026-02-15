export interface Attachment {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath: string | null;
}

export interface Reaction {
  emoji: string;
  count: number;
  ids: string[];
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  commentCount: number;
  attachments: Attachment[];
}

export interface Draft {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  reactions: Reaction[];
}

export interface TrashedPost {
  id: string;
  content: string;
  createdAt: string;
  deletedAt: string;
  daysRemaining: number;
}
