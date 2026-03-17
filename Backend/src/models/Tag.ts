export interface Tag {
  TagID: number;
  TagName: string;
  CreatedAt: Date;
}

export interface CreateTagDTO {
  TagName: string;
}

export interface TagWithCount extends Tag {
  PostCount?: number;
  FollowerCount?: number;
}
