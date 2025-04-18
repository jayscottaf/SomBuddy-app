import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DailyCheckInCard() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [aiResponse, setAIResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { mood: string; message: string }) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      if (!response.ok) {
        throw new Error("Failed to send feedback");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Check-in Submitted",
        description: "Your daily check-in has been recorded.",
      });
      setAIResponse(data.response);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your check-in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Missing Information",
        description: "Please select how your day was",
        variant: "destructive",
      });
      return;
    }

    mutate({
      mood: selectedMood,
      message: feedbackText,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex items-center mb-6">
        <span className="text-accent-600 bg-accent-100 p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
        <h3 className="font-heading font-semibold text-lg text-gray-900">How was your day?</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-3">
          <button 
            className={`flex-1 rounded-lg py-3 text-gray-800 text-sm font-medium transition-colors duration-200 ${
              selectedMood === "Tough" 
                ? "bg-red-100 border-2 border-red-300" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedMood("Tough")}
            disabled={isPending}
          >
            😞 Tough
          </button>
          <button 
            className={`flex-1 rounded-lg py-3 text-gray-800 text-sm font-medium transition-colors duration-200 ${
              selectedMood === "Okay" 
                ? "bg-yellow-100 border-2 border-yellow-300" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedMood("Okay")}
            disabled={isPending}
          >
            😐 Okay
          </button>
          <button 
            className={`flex-1 rounded-lg py-3 text-gray-800 text-sm font-medium transition-colors duration-200 ${
              selectedMood === "Good" 
                ? "bg-blue-100 border-2 border-blue-300" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedMood("Good")}
            disabled={isPending}
          >
            🙂 Good
          </button>
          <button 
            className={`flex-1 rounded-lg py-3 text-gray-800 text-sm font-medium transition-colors duration-200 ${
              selectedMood === "Great" 
                ? "bg-green-100 border-2 border-green-300" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedMood("Great")}
            disabled={isPending}
          >
            😄 Great
          </button>
        </div>
        
        <textarea
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Tell us more about your day... (optional)"
          rows={3}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          disabled={isPending}
        />
        
        {aiResponse && (
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mt-4">
            <div className="flex">
              <span className="text-primary-600 bg-white rounded-full p-1 mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <p className="text-primary-800">{aiResponse}</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isPending || !selectedMood}
          >
            {isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </div>
            ) : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
