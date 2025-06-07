import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image - The base64 image data
 * @returns Promise with the secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(base64Image: string): Promise<string> {
  try {
    console.log('Starting Cloudinary upload process...');
    
    // For data URLs, extract just the base64 part
    let imageData = base64Image;
    if (base64Image.startsWith('data:')) {
      console.log('Processing data URL format image');
      const parts = base64Image.split(',');
      imageData = parts[1];
    } else {
      console.log('Processing base64 string (not data URL)');
    }
    
    // Make sure we have a valid data URL for Cloudinary
    const uploadData = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${imageData}`;
    
    console.log('Uploading to Cloudinary servers...');
    
    // Upload to Cloudinary
const result = await cloudinary.uploader.upload(uploadData, {
  folder: 'sombuddy-app',
  resource_type: 'image',
  public_id: `user_upload_${Date.now()}`,
});
    
    console.log(`Cloudinary upload successful! URL: ${result.secure_url}`);
    
    // Return the secure URL
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete an image from Cloudinary by URL
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract the public_id from the URL
    const parts = imageUrl.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    
    // Delete the image
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image with public_id: ${publicId}`);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error for cleanup operations
  }
}