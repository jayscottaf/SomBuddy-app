import fetch from 'node-fetch';

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
  imageData?: string
) {
  // Create a message content array
  let messageContent: any[] = [];

  // Add text content if provided
  if (content && content.trim() !== '') {
    messageContent.push({ type: "text", text: content });
  }
  
  // If we have image data, upload it as a file first and then reference it
  if (imageData) {
    try {
      console.log('Processing image data...');
      
      // Check image data size
      const imageSize = imageData.length;
      console.log(`Image data size: ${Math.round(imageSize / 1024)}KB`);
      
      // Ensure image data is correctly formatted for OpenAI API requirements
      // The OpenAI API expects a proper URL or a data URL with the correct format
      let formattedImageData = imageData;
      
      // If it's already a data URL, ensure it has the correct format
      if (imageData.startsWith('data:')) {
        // Extract just the base64 part from the data URL
        const base64Data = imageData.split(',')[1];
        // Reconstruct it with the correct format
        formattedImageData = `data:image/jpeg;base64,${base64Data}`;
      } else {
        // If it's not a data URL, assume it's base64 and add the prefix
        formattedImageData = `data:image/jpeg;base64,${imageData}`;
      }
      
      console.log('Image data format verified for OpenAI API compatibility.');
      
      // Add to content array as image_url
      messageContent.push({
        type: "image_url",
        image_url: {
          url: formattedImageData
        }
      });
      
      console.log('Image added to message content');
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (messageContent.length === 0) {
    throw new Error('Message must include text or an image');
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
  assistantId: string = 'asst_PZYE18wO7th5Fm9JoOkLEfDJ'
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