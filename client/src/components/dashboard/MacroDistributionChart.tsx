import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface MacroDistributionChartProps {
  protein: number;
  carbs: number;
  fat: number;
  totalCalories: number;
}

export function MacroDistributionChart({
  protein,
  carbs,
  fat,
  totalCalories
}: MacroDistributionChartProps) {
  // Calculate calories from macros
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  
  // Calculate percentages
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100) || 0;
  const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100) || 0;
  const fatPercentage = Math.round((fatCalories / totalCalories) * 100) || 0;

  const data = [
    { name: "Protein", value: proteinCalories, percentage: proteinPercentage },
    { name: "Carbs", value: carbsCalories, percentage: carbsPercentage },
    { name: "Fat", value: fatCalories, percentage: fatPercentage },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="font-heading font-semibold text-gray-900 mb-6">Macro Distribution</h3>
      <div className="h-48 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{totalCalories}</p>
            <p className="text-xs text-gray-500">calories</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
            <p className="text-xs text-gray-500">Protein</p>
          </div>
          <p className="font-medium">{protein}g ({proteinPercentage}%)</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <p className="text-xs text-gray-500">Carbs</p>
          </div>
          <p className="font-medium">{carbs}g ({carbsPercentage}%)</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <p className="text-xs text-gray-500">Fat</p>
          </div>
          <p className="font-medium">{fat}g ({fatPercentage}%)</p>
        </div>
      </div>
    </div>
  );
}
