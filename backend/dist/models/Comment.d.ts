export interface Comment {
    CommentID: number;
    PostID: number;
    UserID: number;
    ParentCommentID: number | null;
    Content: string;
    IsBestAnswer: boolean;
    CreatedAt: Date;
}
export interface CreateCommentDTO {
    PostID: number;
    UserID: number;
    Content: string;
    ParentCommentID?: number;
}
export interface UpdateCommentDTO {
    Content?: string;
    IsBestAnswer?: boolean;
}
export interface CommentWithUser extends Comment {
    Username: string;
    FullName: string;
    AvatarURL: string | null;
    Replies?: CommentWithUser[];
}
//# sourceMappingURL=Comment.d.ts.map