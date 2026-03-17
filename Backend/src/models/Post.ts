export interface Post {
  PostID: number;
  UserID: number;
  Title: string;
  Content: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreatePostDTO {
  UserID: number;
  Title: string;
  Content: string;
  TagIDs?: number[];
}

export interface UpdatePostDTO {
  Title?: string;
  Content?: string;
}

export interface PostWithUser extends Post {
  Username: string;
  FullName: string;
  AvatarURL: string | null;
  Tags?: string[];
}
