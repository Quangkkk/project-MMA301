export interface Message {
  MessageID: number;
  ConversationID: number;
  SenderID: number;
  Content: string;
  AttachmentURL: string | null;
  IsRead: boolean;
  CreatedAt: Date;
}

export interface CreateMessageDTO {
  ConversationID: number;
  SenderID: number;
  Content: string;
  AttachmentURL?: string;
}

export interface UpdateMessageDTO {
  IsRead?: boolean;
}

export interface MessageResponse {
  MessageID: number;
  ConversationID: number;
  SenderID: number;
  Content: string;
  AttachmentURL: string | null;
  IsRead: boolean;
  CreatedAt: Date;
  // Sender details from join
  SenderUsername?: string;
  SenderFullName?: string;
  SenderAvatarURL?: string | null;
}
