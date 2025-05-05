import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Layover Fuel Dashboard</h1>
            <p className="text-gray-600 mt-2">Stay on track with your fitness goals while traveling</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
        
        <div className="border-b pb-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Daily Calories</p>
              <p className="text-2xl font-bold text-gray-900">1,450</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{width: '65%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 2,200</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Protein</p>
              <p className="text-2xl font-bold text-gray-900">85g</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 140g</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Steps</p>
              <p className="text-2xl font-bold text-gray-900">7,500</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 10,000</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Water</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{width: '63%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 8 glasses</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Try Our AI Assistant Chat</h2>
          <p className="text-gray-600 mb-6">
            Our AI-powered assistant can analyze photos of your meals to estimate nutritional content,
            provide workout tips, and help you make healthy choices while traveling.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-semibold mb-3">Layover Fuel Assistant</h3>
            <p className="text-gray-600 mb-6">
              Chat with our AI fitness coach to analyze food photos, get nutrition advice,
              and receive personalized workout recommendations.
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                <MessageSquare className="h-6 w-6" />
                Open Chat Assistant
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <h3 className="text-lg font-medium mb-4">About Layover Fuel</h3>
          <p className="text-gray-600">
            Layover Fuel helps travelers maintain their fitness and nutrition goals while on the go.
            Our AI-powered platform creates personalized meal and workout plans that adapt to your travel schedule,
            available equipment, and dietary preferences.
          </p>
        </div>
      </div>
    </div>
  );
}