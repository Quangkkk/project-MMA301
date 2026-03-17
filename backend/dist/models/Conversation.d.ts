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
    OtherUser?: {
        UserID: number;
        Username: string;
        FullName: string;
        AvatarURL: string | null;
    };
    LastMessage?: string;
    UnreadCount?: number;
}
//# sourceMappingURL=Conversation.d.ts.map