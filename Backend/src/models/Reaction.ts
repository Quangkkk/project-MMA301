export interface Reaction {
  ReactionID: number;
  UserID: number;
  TargetID: number;
  TargetType: 'Post' | 'Comment';
  ReactionType: string; // 'Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'
  CreatedAt: Date;
}

export interface CreateReactionDTO {
  UserID: number;
  TargetID: number;
  TargetType: 'Post' | 'Comment';
  ReactionType: string;
}

export interface ReactionSummary {
  TargetID: number;
  TargetType: string;
  ReactionType: string;
  Count: number;
}
