// Quick test script to verify Cloudinary is working
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test upload with a simple base64 string
const sampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function testUpload() {
  try {
    console.log('Testing Cloudinary upload...');
    const result = await cloudinary.uploader.upload(sampleBase64, {
      folder: 'sombuddy-test',
    });
    console.log('Upload successful!');
    console.log('Public URL:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
  }
}

testUpload().then(console.log).catch(console.error);