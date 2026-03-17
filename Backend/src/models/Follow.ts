export interface Follow {
  FollowerID: number;
  TargetID: number;
  Type: 'User' | 'Tag';
  CreatedAt: Date;
}

export interface CreateFollowDTO {
  FollowerID: number;
  TargetID: number;
  Type: 'User' | 'Tag';
}

export interface FollowWithDetails extends Follow {
  TargetName?: string;
  TargetAvatarURL?: string;
}
