export interface Media {
  MediaID: number;
  FileName: string;
  OriginalFileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
  MimeType: string;
  UploadedByUserID: number;
  UploadDate: Date;
  IsActive: boolean;
}

export interface MediaEntityMapping {
  MappingID: number;
  MediaID: number;
  EntityType: 'Post' | 'Comment' | 'Message' | 'User';
  EntityID: number;
  MediaType: 'Image' | 'Video' | 'Document' | 'avatar';
  CreatedDate: Date;
}

export interface CreateMediaDTO {
  FileName: string;
  OriginalFileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
  MimeType: string;
  UploadedByUserID: number;
}

export interface CreateMediaMappingDTO {
  MediaID: number;
  EntityType: 'Post' | 'Comment' | 'Message' | 'User';
  EntityID: number;
  MediaType: 'Image' | 'Video' | 'Document' | 'avatar';
}
