import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Send, ArrowLeft, Home } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string[];
  imageUrl?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize a thread when the component mounts
  useEffect(() => {
    const storedThreadId = localStorage.getItem("assistantThreadId");
    if (storedThreadId) {
      setThreadId(storedThreadId);
      fetchMessages(storedThreadId);
    } else {
      createThread();
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create a new thread
  const createThread = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/assistant/thread", {});
      if (!response.ok) {
        throw new Error("Failed to create thread");
      }
      const data = await response.json();
      setThreadId(data.threadId);
      localStorage.setItem("assistantThreadId", data.threadId);
      
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: ["Welcome to Layover Fuel! I'm your personal nutrition and fitness assistant. I can help you analyze your meals, suggest workouts, and provide travel-friendly fitness tips. How can I help you today?"],
        },
      ]);
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages from a thread
  const fetchMessages = async (tid: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/assistant/messages/${tid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      
      // Format messages - ensure they're in chronological order (oldest first)
      // The API returns messages in reverse chronological order (newest first)
      // so we need to reverse them to display correctly
      const formattedMessages = data.messages
        .slice() // Create a copy of the array to avoid mutating the original
        .reverse() // Reverse to get oldest first
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content.map((content: any) => 
            content.type === "text" ? content.text.value : ""
          ).filter(Boolean),
          imageUrl: msg.content.find((c: any) => c.type === "image_file")?.image_file?.file_id,
        }));
      
      // Add welcome message if no messages
      if (formattedMessages.length === 0) {
        formattedMessages.push({
          id: "welcome",
          role: "assistant",
          content: ["Welcome to Layover Fuel! I'm your personal nutrition and fitness assistant. I can help you analyze your meals, suggest workouts, and provide travel-friendly fitness tips. How can I help you today?"],
        });
      }
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, imageData }: { message: string; imageData?: string }) => {
      if (!threadId) throw new Error("No thread ID");
      
      const response = await apiRequest("POST", "/api/assistant/message", {
        threadId,
        message,
        imageData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update messages with the new ones - make sure they're in chronological order
      const newMessages = data.messages
        .slice() // Create a copy of the array to avoid mutating the original
        .reverse() // Reverse to get oldest first
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content.map((content: any) => 
            content.type === "text" ? content.text.value : ""
          ).filter(Boolean),
          imageUrl: msg.content.find((c: any) => c.type === "image_file")?.image_file?.file_id,
        }));
      
      setMessages(newMessages);
      setInput("");
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send a message
  const sendMessage = () => {
    if (!input.trim() && !tempImage) return;
    
    // Add user message to the UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: [input],
      imageUrl: tempImage || undefined,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Add processing message
    const processingMessage: Message = {
      id: "processing",
      role: "assistant",
      content: ["Thinking..."],
    };
    
    setMessages((prev) => [...prev, processingMessage]);
    
    // Send the message to the API
    sendMessageMutation.mutate({
      message: input,
      imageData: tempImage || undefined,
    });
    
    // Clear the input and image
    setInput("");
    setTempImage(null);
  };

  // Handle image upload
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  const handleImageSelect = (file: File, preview: string) => {
    setTempImage(preview);
    toast({
      title: "Image added",
      description: "Your food photo is ready to be analyzed. Add a message or just send it as is.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white">Layover Fuel Assistant</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Messages container - fixed to show messages in correct order */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id + index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-tr-none"
                    : "bg-gray-700 text-white rounded-tl-none"
                }`}
              >
                {message.imageUrl && (
                  <div className="mb-2">
                    <img
                      src={
                        message.imageUrl.startsWith("data:")
                          ? message.imageUrl
                          : `https://api.openai.com/v1/files/${message.imageUrl}/content`
                      }
                      alt="Uploaded image"
                      className="w-full object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {message.content.map((text, i) => (
                  <p key={i} className="mb-1">
                    {text}
                  </p>
                ))}
                
                {message.id === "processing" && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-1"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150 mr-1"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        {/* Display image to be sent */}
        {tempImage && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-300">Image to analyze:</p>
              <button
                onClick={() => setTempImage(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <img
              src={tempImage}
              alt="Preview"
              className="w-full max-h-40 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-end space-x-2">
          <ImageUpload
            onImageSelect={handleImageSelect}
            className="text-gray-400 hover:text-gray-200 p-2"
          />
          <div className="flex-1 bg-gray-700 rounded-full overflow-hidden">
            <textarea
              className="w-full bg-gray-700 text-white border-none px-4 py-3 focus:outline-none resize-none"
              placeholder="Message..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sendMessageMutation.isPending || isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              style={{ 
                overflowY: 'auto', 
                maxHeight: '100px',
                minHeight: '40px',
              }}
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-blue-500 text-white hover:bg-blue-600"
            onClick={sendMessage}
            disabled={sendMessageMutation.isPending || isLoading || (!input.trim() && !tempImage)}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}