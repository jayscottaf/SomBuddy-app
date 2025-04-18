import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";

export function DailyCheckInCard() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [aiResponse, setAIResponse] = useState<string | null>(null);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<any | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
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

  const mealAnalysisMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/meal-analysis", { imageData });
      if (!response.ok) {
        throw new Error("Failed to analyze meal image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMealAnalysis(data.result);
      setAnalyzingImage(false);
      
      // Add the analysis to the feedback text
      const analysisText = `
Meal analysis:
- Calories: ~${data.result.estimate.calories} kcal
- Protein: ~${data.result.estimate.protein}g
- Carbs: ~${data.result.estimate.carbs}g
- Fat: ~${data.result.estimate.fat}g
${data.result.analysis}`;
      
      setFeedbackText((prev) => 
        prev ? prev + "\n\n" + analysisText : analysisText
      );
    },
    onError: () => {
      setAnalyzingImage(false);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (file: File, preview: string) => {
    setMealImage(preview);
    setAnalyzingImage(true);
    
    // Process the image
    const base64Data = preview.split(',')[1]; // Remove the data URI prefix
    mealAnalysisMutation.mutate(base64Data);
  };

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
        
        <div className="relative">
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Tell us more about your day... (optional)"
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={isPending}
          />
          <div className="absolute bottom-3 right-3">
            <ImageUpload 
              onImageSelect={handleImageSelect}
              className="text-gray-400 hover:text-primary-500"
            />
          </div>
        </div>
        
        {/* Show meal image if uploaded */}
        {mealImage && (
          <div className="relative mt-4 p-2 border rounded-lg bg-gray-50">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Meal Photo</p>
                <button 
                  onClick={() => {
                    setMealImage(null); 
                    setMealAnalysis(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="relative">
                <img src={mealImage} alt="Your meal" className="rounded w-full max-h-48 object-cover" />
                
                {analyzingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                    <div className="animate-pulse text-white flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {mealAnalysis && (
                <div className="bg-white p-3 rounded-lg border text-sm space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="font-medium">{mealAnalysis.estimate.calories}</p>
                      <p className="text-xs text-gray-500">calories</p>
                    </div>
                    <div>
                      <p className="font-medium">{mealAnalysis.estimate.protein}g</p>
                      <p className="text-xs text-gray-500">protein</p>
                    </div>
                    <div>
                      <p className="font-medium">{mealAnalysis.estimate.carbs}g</p>
                      <p className="text-xs text-gray-500">carbs</p>
                    </div>
                    <div>
                      <p className="font-medium">{mealAnalysis.estimate.fat}g</p>
                      <p className="text-xs text-gray-500">fat</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
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
            disabled={isPending || !selectedMood || analyzingImage}
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
