import fetch from 'node-fetch';
import { uploadImageToCloudinary } from './cloudinary-service';
import { detectImageType, generateContextualPrompt } from './image-detection-service';
import { analyzeWineMenu, formatWineMenuForDisplay } from './wine-menu-service';

// API endpoint for OpenAI API proxying
export const OPENAI_API_BASE = 'https://api.openai.com';

// Forward a request to the OpenAI API
export async function proxyRequestToOpenAI(
  method: string,
  path: string,
  body?: any,
  apiKey: string = process.env.OPENAI_API_KEY || ''
) {
  try {
    // Create headers for the OpenAI request
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    // Create a URL for the OpenAI request
    const url = `${OPENAI_API_BASE}${path}`;

    // Make the request to OpenAI
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get the response
    const data = await response.json();

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('Error proxying request to OpenAI:', error);
    throw error;
  }
}

// Get the thread ID from the session or create a new one
export async function getOrCreateThread(existingThreadId?: string) {
  if (existingThreadId) {
    return existingThreadId;
  }

  // Create a new thread
  const response = await proxyRequestToOpenAI('POST', '/v1/threads', {});

  if (response.status !== 200) {
    throw new Error(`Failed to create thread: ${JSON.stringify(response.data)}`);
  }

  return response.data.id;
}

// Add a message to a thread
export async function addMessageToThread(
  threadId: string, 
  content: string,
  imageData?: string | string[]
) {
  // Create a message content array
  let messageContent: any[] = [];

  // Add text content if provided
  if (content && content.trim() !== '') {
    messageContent.push({ type: "text", text: content });
  }

  // Handle either a single image or an array of images
  const imagesToProcess = Array.isArray(imageData) ? imageData : (imageData ? [imageData] : []);

  // If we have image data, upload each to Cloudinary and add to message content
  if (imagesToProcess.length > 0) {
    console.log(`Processing ${imagesToProcess.length} images...`);

    // Track successful and failed uploads
    let successfulUploads = 0;
    let failedUploads = 0;

    // Process each image in the array
    for (const imgData of imagesToProcess) {
      try {
        if (!imgData) continue;

        // Check image data size
        const imageSize = imgData.length;
        console.log(`Processing image ${successfulUploads + failedUploads + 1}: ${Math.round(imageSize / 1024)}KB`);

        // First, make sure we have a valid data URL
        let processedImageData = imgData;
        if (!imgData.startsWith('data:')) {
          processedImageData = `data:image/jpeg;base64,${imgData}`;
        }

        console.log(`Uploading image ${successfulUploads + failedUploads + 1} to Cloudinary...`);

        // Upload the image to Cloudinary and get a public URL
        const imageUrl = await uploadImageToCloudinary(processedImageData);
        console.log(`Image ${successfulUploads + 1} uploaded successfully to Cloudinary: ${imageUrl}`);

        // Add to content array as image_url with the public Cloudinary URL
        messageContent.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });

        successfulUploads++;
        console.log(`Image ${successfulUploads} successfully added to message content`);
      } catch (error) {
        failedUploads++;
        console.error(`Error processing image ${successfulUploads + failedUploads}:`, error);

        // Continue with other images rather than stopping completely
        if (error instanceof Error) {
          console.error(`Cloudinary upload failed: ${error.message}`);
        } else {
          console.error(`Cloudinary upload failed: Unknown error`);
        }
      }
    }

    // Only add error message if ALL uploads failed
    if (failedUploads > 0 && successfulUploads === 0) {
      console.error(`All ${failedUploads} image uploads failed`);

      // In case of complete failure, we'll still send the user's message text if available
      // But we'll add a note about the image upload failure
      if (!messageContent.some(item => item.type === "text")) {
        messageContent.push({
          type: "text",
          text: "I tried to upload food images for analysis, but there was a technical issue. Could you help me with my nutrition or workout questions instead?"
        });
      } else {
        // Add a note about the image upload failure to the existing message
        messageContent.push({
          type: "text",
          text: "Note: There was an issue processing your images. Let me answer your other questions."
        });
      }
    } else if (failedUploads > 0 && successfulUploads > 0) {
      // Some uploads succeeded, some failed
      console.log(`${successfulUploads} images uploaded successfully, ${failedUploads} failed`);

      // Only add a note if there's already text content
      if (messageContent.some(item => item.type === "text")) {
        messageContent.push({
          type: "text",
          text: `Note: ${failedUploads} of your ${failedUploads + successfulUploads} images couldn't be processed, but I'll analyze the rest.`
        });
      }
    } else if (successfulUploads > 0) {
      console.log(`All ${successfulUploads} images uploaded successfully`);
    }
  }

  // Detect image type and generate contextual prompt
  if (imagesToProcess.length > 0 && messageContent.some(item => item.type === "image_url")) {
    // Get the first successfully uploaded image URL for analysis
    const firstImageContent = messageContent.find(item => item.type === "image_url");
    if (firstImageContent && firstImageContent.image_url?.url) {
      const firstImageUrl = firstImageContent.image_url.url;
      
      const imageType = await detectImageType(firstImageUrl);

      // Generate contextual prompt based on image type
      let contextualPrompt = generateContextualPrompt(imageType, content);

      // For wine menus, perform detailed OCR analysis
      if (imageType === 'wine_menu') {
        try {
          const wineMenuAnalysis = await analyzeWineMenu(firstImageUrl);
          const formattedWineList = formatWineMenuForDisplay(wineMenuAnalysis);

          contextualPrompt = `You are SomBuddy, a friendly wine-pairing expert. I've performed detailed OCR analysis of this wine menu. Here are ALL the wines available:

${formattedWineList}

${content ? `User's message: ${content}` : ''}

Please provide wine pairing recommendations based ONLY on the wines listed above. Be conversational and friendly while being informative about wine pairings.`;
        } catch (error) {
          console.error('Wine menu OCR failed, using standard prompt:', error);
          // Fall back to standard contextual prompt
        }
      }

      // Add the contextual prompt to the user's message
      content = contextualPrompt;
    }
  }

  if (messageContent.length === 0 && (!content || content.trim() === '')) {
    throw new Error('Message must include text or at least one valid image');
  }

  if (content && content.trim() !== '') {
      messageContent.push({ type: "text", text: content });
  }

  console.log(`Adding message to thread ${threadId} with content types: ${messageContent.map(c => c.type).join(', ')}`);

  try {
    const response = await proxyRequestToOpenAI(
      'POST', 
      `/v1/threads/${threadId}/messages`,
      {
        role: "user",
        content: messageContent
      }
    );

    if (response.status !== 200) {
      console.error('OpenAI API error:', response.data);
      throw new Error(`Failed to add message to thread: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }
}

// Run the assistant on a thread
export async function runAssistantOnThread(
  threadId: string, 
  assistantId: string = 'asst_hHy68PuBx0Z44uF9cAna4oJD'
) {
  const response = await proxyRequestToOpenAI(
    'POST',
    `/v1/threads/${threadId}/runs`,
    {
      assistant_id: assistantId
    }
  );

  if (response.status !== 200) {
    throw new Error(`Failed to run assistant: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

// Check the status of a run
export async function checkRunStatus(threadId: string, runId: string) {
  const response = await proxyRequestToOpenAI(
    'GET',
    `/v1/threads/${threadId}/runs/${runId}`
  );

  if (response.status !== 200) {
    throw new Error(`Failed to check run status: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

// Get messages from a thread
export async function getMessagesFromThread(threadId: string) {
  const response = await proxyRequestToOpenAI(
    'GET',
    `/v1/threads/${threadId}/messages`
  );

  if (response.status !== 200) {
    throw new Error(`Failed to get messages: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}