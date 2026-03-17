import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Cloudinary configuration from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

class CloudinaryService {
  /**
   * Upload image from buffer to Cloudinary
   * @param buffer - Image buffer
   * @param folder - Folder name in Cloudinary (default: 'student_forum')
   * @param fileName - Optional file name
   * @returns Upload result with URL
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'student_forum',
    fileName?: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: fileName,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes
            });
          } else {
            reject(new Error('Upload failed - no result'));
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images
   * @param buffers - Array of image buffers with metadata
   * @param folder - Folder name in Cloudinary
   * @returns Array of upload results
   */
  async uploadMultipleImages(
    buffers: Array<{ buffer: Buffer; fileName?: string }>,
    folder: string = 'student_forum'
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = buffers.map((item) =>
        this.uploadImage(item.buffer, folder, item.fileName)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - Public ID of the image
   * @returns Deletion result
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images
   * @param publicIds - Array of public IDs
   * @returns Deletion results
   */
  async deleteMultipleImages(publicIds: string[]): Promise<any> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images');
    }
  }
}

export default new CloudinaryService();
