'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

// We pass a function from the Dashboard to refresh the chart when food is added
export default function FoodSearch({ onFoodLogged }: { onFoodLogged: () => void }) {
    const [foodName, setFoodName] = useState('');
    const [grams, setGrams] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogFood = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodName || !grams) return;

        setLoading(true);
        setMessage('🔍 Checking database...');
        const normalizedFood = foodName.toLowerCase().trim();

        try {
            // 1. Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // 2. Check Supabase first (Your Smart Cache)
            let { data: localFood } = await supabase
                .from('food_dictionary')
                .select('*')
                .eq('food_name', normalizedFood)
                .single();

            let foodId;
            let caloriesPer100g;

            if (localFood) {
                // FOUND IN DATABASE!
                foodId = localFood.id;
                caloriesPer100g = localFood.calories_per_100g;
                setMessage(`⚡ Found ${normalizedFood} in cache!`);
            } else {
                // 3. NOT FOUND. Fetch from USDA API.
                setMessage(`🌐 Fetching ${normalizedFood} from USDA...`);
                const USDA_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
                const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${normalizedFood}&pageSize=1&api_key=${USDA_KEY}`);
                const data = await res.json();

                if (!data.foods || data.foods.length === 0) {
                    setMessage(`❌ Couldn't find "${foodName}". Try another word.`);
                    setLoading(false);
                    return;
                }

                const foodData = data.foods[0];
                const calorieNutrient = foodData.foodNutrients.find((n: any) => n.nutrientName.includes('Energy'));
                caloriesPer100g = calorieNutrient ? calorieNutrient.value : 0;

                // 4. Save to Supabase so we never have to fetch it again
                const { data: newFood, error: insertError } = await supabase
                    .from('food_dictionary')
                    .insert([{ food_name: normalizedFood, calories_per_100g: caloriesPer100g }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                foodId = newFood.id;
            }

            // 5. Calculate total calories based on grams eaten
            const totalCalories = (caloriesPer100g / 100) * Number(grams);

            // 6. Log it to the user's day!
            const today = new Date().toISOString().split('T')[0];
            await supabase
                .from('daily_logs')
                .insert([{
                    user_id: user.id,
                    date: today,
                    food_id: foodId,
                    quantity_g: Number(grams),
                    calories_consumed: totalCalories
                }]);

            setMessage(`✅ Logged ${grams}g of ${normalizedFood} (${totalCalories.toFixed(0)} kcal)`);
            setFoodName('');
            setGrams('');

            // Tell the dashboard to update the chart!
            onFoodLogged();

        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Error: ${error.message}`);
        }

        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Log Food</h2>

            <form onSubmit={handleLogFood} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="e.g., Poha, Apple, Chicken"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div className="w-full sm:w-32">
                    <input
                        type="number"
                        placeholder="Grams"
                        value={grams}
                        onChange={(e) => setGrams(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="1"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {loading ? 'Adding...' : '+ Add'}
                </button>
            </form>

            {/* Status Message */}
            {message && (
                <p className={`mt-3 text-sm font-medium ${message.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}