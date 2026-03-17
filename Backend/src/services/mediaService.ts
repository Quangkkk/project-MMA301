import { getConnection } from '../config/database';
import sql from 'mssql';
import { CreateMediaDTO, CreateMediaMappingDTO, Media, MediaEntityMapping } from '../models/Media';
import cloudinaryService from './cloudinaryService';

class MediaService {
  /**
   * Save media info to database
   */
  async createMedia(data: CreateMediaDTO): Promise<Media> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('fileName', sql.NVarChar, data.FileName)
        .input('originalFileName', sql.NVarChar, data.OriginalFileName)
        .input('filePath', sql.NVarChar, data.FilePath)
        .input('fileSize', sql.BigInt, data.FileSize)
        .input('fileType', sql.NVarChar, data.FileType)
        .input('mimeType', sql.NVarChar, data.MimeType)
        .input('uploadedByUserID', sql.Int, data.UploadedByUserID)
        .query(`
          INSERT INTO dbo.Media (FileName, OriginalFileName, FilePath, FileSize, FileType, MimeType, UploadedByUserID, UploadDate, IsActive)
          OUTPUT INSERTED.*
          VALUES (@fileName, @originalFileName, @filePath, @fileSize, @fileType, @mimeType, @uploadedByUserID, GETDATE(), 1)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating media:', error);
      throw new Error('Failed to create media record');
    }
  }

  /**
   * Create media-entity mapping
   */
  async createMediaMapping(data: CreateMediaMappingDTO): Promise<MediaEntityMapping> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('mediaId', sql.Int, data.MediaID)
        .input('entityType', sql.NVarChar, data.EntityType)
        .input('entityId', sql.Int, data.EntityID)
        .input('mediaType', sql.NVarChar, data.MediaType)
        .query(`
          INSERT INTO dbo.Media_Entity_Mapping (MediaID, EntityType, EntityID, MediaType, CreatedDate)
          OUTPUT INSERTED.*
          VALUES (@mediaId, @entityType, @entityId, @mediaType, GETDATE())
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating media mapping:', error);
      throw new Error('Failed to create media mapping');
    }
  }

  /**
   * Get media by entity
   */
  async getMediaByEntity(entityType: string, entityId: number): Promise<Media[]> {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('entityType', sql.NVarChar, entityType)
        .input('entityId', sql.Int, entityId)
        .query(`
          SELECT m.*
          FROM dbo.Media m
          INNER JOIN dbo.Media_Entity_Mapping mem ON m.MediaID = mem.MediaID
          WHERE mem.EntityType = @entityType AND mem.EntityID = @entityId AND m.IsActive = 1
          ORDER BY mem.CreatedDate ASC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error getting media by entity:', error);
      throw new Error('Failed to get media');
    }
  }

  /**
   * Upload images and save to database
   */
  async uploadImages(
    files: Array<{ buffer: Buffer; originalName: string; mimeType: string; size: number }>,
    userId: number,
    folder: string = 'student_forum/posts'
  ): Promise<Media[]> {
    try {
      // Upload to Cloudinary
      const uploadResults = await cloudinaryService.uploadMultipleImages(
        files.map(f => ({ buffer: f.buffer, fileName: f.originalName })),
        folder
      );

      // Save to database
      const mediaRecords = await Promise.all(
        files.map(async (file, index) => {
          const uploadResult = uploadResults[index];
          
          return await this.createMedia({
            FileName: uploadResult.publicId,
            OriginalFileName: file.originalName,
            FilePath: uploadResult.url,
            FileSize: file.size,
            FileType: uploadResult.format,
            MimeType: file.mimeType,
            UploadedByUserID: userId
          });
        })
      );

      return mediaRecords;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete media and its mappings
   */
  async deleteMedia(mediaId: number): Promise<void> {
    try {
      const pool = await getConnection();

      // Get media info for Cloudinary deletion
      const mediaResult = await pool.request()
        .input('mediaId', sql.Int, mediaId)
        .query('SELECT FileName FROM dbo.Media WHERE MediaID = @mediaId');

      if (mediaResult.recordset.length > 0) {
        const fileName = mediaResult.recordset[0].FileName;
        
        // Delete from Cloudinary
        await cloudinaryService.deleteImage(fileName);
      }

      // Soft delete in database
      await pool.request()
        .input('mediaId', sql.Int, mediaId)
        .query('UPDATE dbo.Media SET IsActive = 0 WHERE MediaID = @mediaId');

    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media');
    }
  }
}

export default new MediaService();
