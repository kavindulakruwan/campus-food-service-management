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
import { Activity, Flame, Utensils, Weight, Award, Target, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-slate-50 min-h-screen dark:bg-slate-900 transition-colors duration-200">
      
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Management & Diet
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              Pro Access
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Track your campus dining trends, manage health goals, and generate AI meal plans.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calories Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-600 dark:text-slate-300">Daily Calories</h3>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
              On Track
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">2,150</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ 2,500 kcal</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '86%' }}></div>
          </div>
        </div>

        {/* Macros Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <Target className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-slate-600 dark:text-slate-300">Macro Targets</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium mb-1">Protein</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">120g</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium mb-1">Carbs</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">240g</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium mb-1">Fats</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">65g</span>
            </div>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden mt-4">
            <div className="bg-sky-500 w-1/3"></div>
            <div className="bg-emerald-500 w-1/2"></div>
            <div className="bg-amber-400 w-1/6"></div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-600 dark:text-slate-300">Weekly Budget</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
              Safe
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">LKR 4,250</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">left</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> 12% less spending than last week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Analytics & Charts */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Analytics Container */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/60 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="text-indigo-500 w-6 h-6" /> 
                Dining Analytics
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bar Chart: Weekly Trend */}
              <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Weekly Consumption</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyMealData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: 'rgba(226, 232, 240, 0.4)'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)'}} 
                      />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                      <Bar dataKey="breakfast" name="Breakfast" stackId="a" fill="#f97316" radius={[0, 0, 4, 4]} barSize={24} />
                      <Bar dataKey="lunch" name="Lunch" stackId="a" fill="#38bdf8" barSize={24} />
                      <Bar dataKey="dinner" name="Dinner" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart: Monthly Most Pop */}
              <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Your Top Dishes</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyPopularMeals}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {monthlyPopularMeals.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)'}} 
                      />
                      <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* AI Calorie & Diet Planner Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700/60">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                   <Utensils className="text-rose-600 dark:text-rose-400 w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Diet Architect</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your metrics to generate a personalized campus meal plan.</p>
                </div>
             </div>

             <form onSubmit={handleDietSubmit} className="space-y-6">
                {/* Form Group 1: Basics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Age</label>
                      <input 
                         type="number" required value={age} onChange={(e) => setAge(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                         placeholder="e.g. 21"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                      <select 
                         value={gender} onChange={(e) => setGender(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      >
                         <option value="male">Male</option>
                         <option value="female">Female</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Weight <span className="text-slate-400 normal-case">(kg)</span></label>
                      <input 
                         type="number" required value={weight} onChange={(e) => setWeight(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                         placeholder="e.g. 70"
                      />
                   </div>
                </div>

                {/* Form Group 2: Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Height <span className="text-slate-400 normal-case">(cm)</span></label>
                      <input 
                         type="number" required value={height} onChange={(e) => setHeight(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                         placeholder="e.g. 175"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Primary Goal</label>
                      <select 
                         value={goal} onChange={(e) => setGoal(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      >
                         <option value="lose weight">Lose Weight (Deficit)</option>
                         <option value="maintain">Maintain Weight</option>
                         <option value="build muscle">Build Muscle (Surplus)</option>
                      </select>
                   </div>
                </div>

                {/* Form Group 3: Activity & Prefs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Activity Level</label>
                      <select 
                         value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      >
                         <option value="sedentary">Sedentary (Little/No)</option>
                         <option value="lightly active">Lightly Active (1-3 days/wk)</option>
                         <option value="moderately active">Moderately Active (3-5 days/wk)</option>
                         <option value="very active">Very Active (6-7 days/wk)</option>
                      </select>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dietary Preferences</label>
                     <input 
                        type="text" required value={preferences} onChange={(e) => setPreferences(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        placeholder="e.g. High protein, Low carb, Veg"
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Allergies (Optional)</label>
                   <input 
                      type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      placeholder="e.g. Peanuts, Dairy"
                   />
                </div>

                <div className="pt-2">
                  <button 
                     type="submit" disabled={loading}
                     className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {loading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Crunching Numbers...</span>
                        </>
                     ) : (
                        <>
                           <Flame className="w-5 h-5 text-rose-400 dark:text-rose-200" /> 
                           <span>Generate Action Plan</span>
                        </>
                     )}
                  </button>
                </div>
             </form>
          </div>

        </div>

        {/* Right Column: AI Results & Details */}
        <div className="xl:col-span-1">
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-3xl p-6 shadow-sm border border-rose-100 dark:border-slate-700/60 sticky top-8 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-200/50 dark:border-slate-700">
               <Award className="text-rose-500 w-6 h-6" />
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your AI Plan</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {aiSuggestion ? (
                  <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert prose-rose max-w-none 
                        prose-table:w-full prose-table:border-collapse prose-table:text-sm
                        prose-th:bg-white dark:prose-th:bg-slate-900 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                        prose-td:p-3 prose-td:border-b prose-td:border-rose-100 dark:prose-td:border-slate-700
                        prose-ul:list-disc prose-ul:pl-5 
                        prose-h3:text-lg prose-h3:font-bold prose-h3:text-rose-700 dark:prose-h3:text-rose-400 prose-h3:mt-6 prose-h3:mb-3 
                        prose-p:mb-4 bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiSuggestion}
                     </ReactMarkdown>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center px-6">
                     <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-100 dark:border-slate-700">
                        <Target className="w-10 h-10 text-rose-300 dark:text-rose-500 opacity-80" />
                     </div>
                     <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">No Plan Active</h4>
                     <p className="font-medium text-sm leading-relaxed">
                        Fill out your dietary profile on the left and hit generate to receive your scientifically-backed campus meal schedule.
                     </p>
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