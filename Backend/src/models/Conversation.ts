export interface Conversation {
  ConversationID: number;
  User1ID: number;
  User2ID: number;
  CreatedAt: Date;
  LastMessageAt: Date | null;
}

export interface CreateConversationDTO {
  User1ID: number;
  User2ID: number;
}

export interface UpdateConversationDTO {
  LastMessageAt?: Date;
}

export interface ConversationResponse {
  ConversationID: number;
  User1ID: number;
  User2ID: number;
  CreatedAt: Date;
  LastMessageAt: Date | null;
  // Additional fields from joins
  OtherUser?: {
    UserID: number;
    Username: string;
    FullName: string;
    AvatarURL: string | null;
  };
  LastMessage?: string;
  UnreadCount?: number;
}
