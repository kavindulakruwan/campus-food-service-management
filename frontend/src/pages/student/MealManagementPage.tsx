import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Activity, Flame, Utensils, Weight, Award } from 'lucide-react';
import { startOfWeek, format, parseISO, isSameDay, addDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { postBotMessage } from '../../api/chat.api';
import { getWeeklyMealPlans, getMonthlyMealPlans } from '../../api/mealPlan.api';

interface WeeklyChartData {
  name: string;
  dateObj: Date;
  breakfast: number;
  lunch: number;
  dinner: number;
}

interface MonthlyChartData {
  name: string;
  value: number;
}

const COLORS = ['#f97316', '#0ea5e9', '#10b981', '#f43f5e', '#8b5cf6'];

const MealManagementPage = () => {
  // Real Data State
  const [weeklyMealData, setWeeklyMealData] = useState<WeeklyChartData[]>([]);
  const [monthlyPopularMeals, setMonthlyPopularMeals] = useState<MonthlyChartData[]>([]);
  
  // State for AI Diet Planner
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderately active');
  const [goal, setGoal] = useState('maintain');
  const [preferences, setPreferences] = useState('');
  const [allergies, setAllergies] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const now = new Date();
      
      // 1. Fetch Weekly Data
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Starts Monday
      const weekDateStr = format(weekStart, 'yyyy-MM-dd');
      
      const weeklyRes = await getWeeklyMealPlans(weekDateStr);
      const weeklyPlans = weeklyRes.data?.data?.plans || [];
      
      // Map out Monday to Sunday with 0 counts initially
      const weeklyFormat = Array.from({ length: 7 }).map((_, i) => {
        const dayDate = addDays(weekStart, i);
        return {
          name: format(dayDate, 'EEE'), // Mon, Tue, etc.
          dateObj: dayDate,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        };
      });

      // Populate counts
      weeklyPlans.forEach((plan: any) => {
        if (!plan.date) return;
        const pDate = parseISO(plan.date);
        const dayMatch = weeklyFormat.find(d => isSameDay(d.dateObj, pDate));
        if (dayMatch) {
          if (plan.mealTime === 'breakfast') dayMatch.breakfast += plan.quantity || 1;
          if (plan.mealTime === 'lunch') dayMatch.lunch += plan.quantity || 1;
          if (plan.mealTime === 'dinner') dayMatch.dinner += plan.quantity || 1;
        }
      });
      setWeeklyMealData(weeklyFormat);

      // 2. Fetch Monthly Data
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // getMonth is 0-indexed, api is 1-indexed (usually? Let's check API.. normally yes)
      const monthlyRes = await getMonthlyMealPlans(year, month);
      const monthlyPlans = monthlyRes.data?.data?.plans || [];
      
      // Calculate Most Popular Dishes
      const mealCounts: Record<string, number> = {};
      monthlyPlans.forEach((plan: any) => {
        const name = plan.mealName || 'Unknown';
        mealCounts[name] = (mealCounts[name] || 0) + (plan.quantity || 1);
      });

      // Sort and take top 5
      const sortedMeals = Object.entries(mealCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setMonthlyPopularMeals(sortedMeals.length ? sortedMeals : [{ name: 'No data', value: 1 }]);

    } catch (error) {
      console.error('Failed to load real meal data. Did you link the API?', error);
      // Fallbacks if data fails
      setMonthlyPopularMeals([{ name: 'No data yet', value: 1 }]);
    }
  };

  const handleDietSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !age) return;

    setLoading(true);
    try {
      const dbMenu = `
--- CAMPUS SRI LANKAN FOOD DATABASE ---
Format: Meal Name | Serving Size (g/ml) | Calories (kcal) | Carbs (g) | Protein (g) | Fat (g)

White Rice + Dhal | 350g | 420 | 75 | 12 | 8
Red Rice + Fish Curry | 400g | 500 | 65 | 25 | 15
Rice + Chicken Curry | 400g | 550 | 60 | 30 | 18
Rice + Egg Curry | 350g | 480 | 55 | 20 | 14
Rice + Parippu + Mallung | 400g | 450 | 70 | 15 | 10
Rice + Ambul Thiyal | 350g | 460 | 50 | 28 | 16
Rice + Pork Curry | 400g | 650 | 55 | 30 | 30
Rice + Beetroot Curry | 350g | 430 | 65 | 10 | 12
Rice + Jackfruit Curry | 400g | 470 | 70 | 8 | 14
Rice + Brinjal Moju | 350g | 500 | 60 | 8 | 22
Coconut Roti | 120g | 300 | 40 | 6 | 12
Pol Roti + Lunu Miris | 150g | 350 | 45 | 7 | 15
Godamba Roti | 120g | 320 | 42 | 6 | 14
Egg Roti | 180g | 450 | 50 | 15 | 20
Chicken Roti | 200g | 500 | 55 | 20 | 22
Vegetable Roll | 100g | 200 | N/A | N/A | N/A
Fish Roll | 100g | 250 | N/A | N/A | N/A
Chicken Roll | 120g | 300 | N/A | N/A | N/A
Patties (Fish) | 100g | 280 | N/A | N/A | N/A
Patties (Chicken) | 120g | 320 | N/A | N/A | N/A
Wattalappam | 150g | 350 | N/A | N/A | N/A
Kiribath | 200g | 400 | N/A | N/A | N/A
Milk Rice + Lunu Miris | 250g | 450 | N/A | N/A | N/A
Kavum | 100g | 300 | N/A | N/A | N/A
Kokis | 80g | 250 | N/A | N/A | N/A
`;

      const prompt = `Act as an expert clinical dietitian for a Sri Lankan campus. 
      USER PROFILE:
      - Age: ${age}
      - Gender: ${gender}
      - Weight: ${weight} kg
      - Height: ${height} cm
      - Activity Level: ${activityLevel}
      - Goal: ${goal}
      - Dietary preferences: ${preferences || 'none'}
      - Allergies: ${allergies || 'none'}
      
      ${dbMenu}

      STRICT RULES:
      1. Explicitly state the user's estimated daily caloric needs (TDEE).
      2. Create a comprehensive 1-day meal plan (e.g. Breakfast, Lunch, Dinner, Snack).
      3. YOU MUST ONLY RECOMMEND FOODS FROM THE 'CAMPUS SRI LANKAN FOOD DATABASE' PROVIDED ABOVE. Do not invent foods.
      4. Format the entire Meal Plan explicitly as a MARKDOWN TABLE with exactly these columns: Meal Time | Item Name | Calories | Protein (g) | Carbs (g) | Fat (g).
      5. Include a final mathematical summary comparing total calories against their target.
      6. Provide brief, encouraging advice below the table on why these specific Sri Lankan foods fit their goal.`;
      
      const response = await postBotMessage(prompt, []);
      setAiSuggestion(response.reply);
    } catch (error) {
      console.error('Failed to fetch AI diet suggestions:', error);
      setAiSuggestion('Oops! The AI dietitian is currently busy helping other students. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Activity className="text-orange-500 w-8 h-8" />
          Meal <span className="text-orange-500">Management & Analytics</span>
        </h1>
        <p className="mt-2 text-slate-500 font-medium text-lg">
          Track campus dining trends and generate personalized AI diet plans.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
         <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Award className="text-sky-500" /> Popular Meals Breakdown
         </h2>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Bar Chart: Weekly Trend */}
            <div className="bg-[#Fdfbf7] p-6 rounded-2xl border border-slate-50">
               <h3 className="text-lg font-bold text-slate-700 mb-6 text-center">Weekly Consumption Trends</h3>
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyMealData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                      <Tooltip 
                         cursor={{fill: 'transparent'}}
                         contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}} 
                      />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                      <Bar dataKey="breakfast" name="Breakfast" stackId="a" fill="#f97316" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="lunch" name="Lunch" stackId="a" fill="#0ea5e9" />
                      <Bar dataKey="dinner" name="Dinner" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Pie Chart: Monthly Most Pop */}
            <div className="bg-[#Fdfbf7] p-6 rounded-2xl border border-slate-50">
               <h3 className="text-lg font-bold text-slate-700 mb-6 text-center">Monthly Top Campus Dishes</h3>
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyPopularMeals}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {monthlyPopularMeals.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}} 
                      />
                      <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      </div>

      {/* AI Calorie & Diet Planner Section */}
      <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-3xl p-8 shadow-sm border border-orange-100">
         <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Flame className="text-orange-500" /> AI Calorie Counter & Diet Planner
         </h2>
         <p className="text-slate-600 mb-8 max-w-3xl">
           Enter your body metrics and daily food preferences. Our AI will analyze your profile and suggest the best campus meals tailored specifically for your health goals.
         </p>

         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/60 lg:col-span-2">
               <form onSubmit={handleDietSubmit} className="space-y-5">
                  
                  {/* Basic Demographics */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Age</label>
                        <input 
                           type="number" 
                           required 
                           value={age}
                           onChange={(e) => setAge(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                           placeholder="e.g. 21"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                        <select 
                           value={gender}
                           onChange={(e) => setGender(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        >
                           <option value="male">Male</option>
                           <option value="female">Female</option>
                        </select>
                     </div>
                  </div>

                  {/* Body Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                           <Weight className="w-4 h-4 text-slate-400" /> Weight (kg)
                        </label>
                        <input 
                           type="number" 
                           required 
                           value={weight}
                           onChange={(e) => setWeight(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                           placeholder="e.g. 70"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Height (cm)</label>
                        <input 
                           type="number" 
                           required 
                           value={height}
                           onChange={(e) => setHeight(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                           placeholder="e.g. 175"
                        />
                     </div>
                  </div>

                  {/* Health Goal */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Health Goal</label>
                        <select 
                           value={goal}
                           onChange={(e) => setGoal(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        >
                           <option value="lose weight">Lose Weight (Caloric Deficit)</option>
                           <option value="maintain">Maintain Weight</option>
                           <option value="build muscle">Build Muscle (Caloric Surplus)</option>
                        </select>
                     </div>
                     <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Activity Level</label>
                        <select 
                           value={activityLevel}
                           onChange={(e) => setActivityLevel(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all text-sm"
                        >
                           <option value="sedentary">Sedentary (Little to no exercise)</option>
                           <option value="lightly active">Lightly Active (1-3 days/week)</option>
                           <option value="moderately active">Moderately Active (3-5 days/week)</option>
                           <option value="very active">Very Active (6-7 days/week)</option>
                        </select>
                     </div>
                  </div>
                  
                  {/* Preferences */}
                  <div className="pt-2 border-t border-slate-100">
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Food Preferences</label>
                     <input 
                        type="text" 
                        required
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="e.g. High protein, Low carb, Vegetarian"
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Allergies (Optional)</label>
                     <input 
                        type="text" 
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="e.g. Peanuts, Dairy"
                     />
                  </div>

                  <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {loading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           Analyzing Profile...
                        </>
                     ) : (
                        <>
                           <Utensils className="w-5 h-5" /> Generate AI Diet Plan
                        </>
                     )}
                  </button>
               </form>
            </div>

            {/* AI Results Display */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/60 lg:col-span-3 min-h-[300px] flex flex-col">
               <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Your Personalized Plan</h3>
               
               <div className="flex-1 rounded-xl bg-[#Fdfbf7] p-5 border border-slate-100 text-slate-700 leading-relaxed overflow-y-auto max-h-[500px]">
                  {aiSuggestion ? (
                     <div className="prose prose-slate prose-orange max-w-none prose-table:w-full prose-table:border-collapse prose-th:bg-orange-100/50 prose-th:p-3 prose-th:text-left prose-th:text-slate-800 prose-td:p-3 prose-td:border-b prose-td:border-slate-200 prose-ul:list-disc prose-ul:pl-5 prose-h3:text-xl prose-h3:font-bold prose-h3:text-orange-600 prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {aiSuggestion}
                        </ReactMarkdown>
                     </div>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                        <Flame className="w-12 h-12 mb-3 text-orange-200" />
                        <p className="font-medium text-center">Submit your metrics on the left<br/>to receive an AI generated student meal plan.</p>
                     </div>
                  )}
               </div>
            </div>

         </div>
      </div>

    </div>
  );
};

export default MealManagementPage;