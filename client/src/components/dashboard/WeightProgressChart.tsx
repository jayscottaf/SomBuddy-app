import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeightEntry {
  date: string;
  weight: number;
}

interface WeightProgressChartProps {
  data: WeightEntry[];
  goalWeight?: number;
  className?: string;
}

export function WeightProgressChart({
  data,
  goalWeight,
  className
}: WeightProgressChartProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  
  // If no data is provided, use sample data
  const chartData = data.length > 0 ? data : [];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-gray-900">Weight Progress</h3>
        <div className="flex items-center space-x-2">
          <button 
            className={`text-xs font-medium px-2 py-1 rounded ${
              timeframe === "week" 
                ? "bg-gray-100 text-gray-700" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setTimeframe("week")}
          >
            Week
          </button>
          <button 
            className={`text-xs font-medium px-2 py-1 rounded ${
              timeframe === "month" 
                ? "bg-gray-100 text-gray-700" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setTimeframe("month")}
          >
            Month
          </button>
          <button 
            className={`text-xs font-medium px-2 py-1 rounded ${
              timeframe === "year" 
                ? "bg-gray-100 text-gray-700" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setTimeframe("year")}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} />
              <YAxis stroke="#6B7280" fontSize={10} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3B82F6" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
                dot={{ r: 4, fill: "#3B82F6" }}
              />
              {goalWeight && (
                <Line 
                  type="monotone" 
                  dataKey={() => goalWeight} 
                  stroke="#10B981" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-sm">No weight data available yet</p>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-end space-x-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary-500 rounded-full mr-1"></span>
            <span className="text-xs text-gray-500">Weight</span>
          </div>
          {goalWeight && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-gray-500">Goal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
