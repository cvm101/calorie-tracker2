'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

// Use the USDA API Key from your .env.local file
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;

export default function FoodSearch({ onFoodLogged }: { onFoodLogged: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // State for the food the user clicks on
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<'g' | 'serving'>('serving'); // <-- Default to serving now!
    const [isSaving, setIsSaving] = useState(false);

    // Search USDA Database
    const searchFood = async () => {
        if (!query) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`);
            const data = await res.json();

            // Map the results to pull out what we need
            const formattedResults = data.foods.map((food: any) => {
                // Find the energy/calorie nutrient
                const calorieNutrient = food.foodNutrients.find(
                    (n: any) => n.nutrientNumber === '208' || n.nutrientName === 'Energy'
                );

                return {
                    fdcId: food.fdcId,
                    name: food.lowercaseDescription || food.description,
                    caloriesPer100g: calorieNutrient ? calorieNutrient.value : 0,
                    // Grab the serving size if USDA provides it, otherwise guess an average 100g portion
                    servingSize: food.servingSize || 100,
                };
            });

            setResults(formattedResults);
        } catch (error) {
            console.error("Error fetching food:", error);
        }
        setIsSearching(false);
    };

    // Save the logged food to Supabase
    const handleLogFood = async () => {
        if (!selectedFood) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Calculate final grams based on the dropdown!
            let finalGrams = 0;
            if (unit === 'g') {
                finalGrams = quantity; // User typed actual grams
            } else {
                // User typed "2 servings", so we multiply 2 by the USDA serving size
                finalGrams = quantity * selectedFood.servingSize;
            }

            // 2. Do the math to get the final calories
            const totalCalories = (selectedFood.caloriesPer100g / 100) * finalGrams;

            // 3. Save to food_dictionary (so the app remembers it)
            const { error: dictError } = await supabase
                .from('food_dictionary')
                .upsert({
                    id: selectedFood.fdcId.toString(),
                    food_name: selectedFood.name,
                    calories_per_100g: selectedFood.caloriesPer100g
                });

            if (dictError) throw dictError;

            // 4. Save to today's logs
            const today = new Date().toISOString().split('T')[0];
            const { error: logError } = await supabase
                .from('daily_logs')
                .insert({
                    user_id: user.id,
                    food_id: selectedFood.fdcId.toString(),
                    date: today,
                    quantity_g: finalGrams, // We always save to DB in grams for consistency
                    calories_consumed: totalCalories
                });

            if (logError) throw logError;

            // 5. Clean up the UI and refresh the dashboard chart
            setSelectedFood(null);
            setQuery('');
            setResults([]);
            setQuantity(1);
            setUnit('serving');
            onFoodLogged();

        } catch (error: any) {
            console.error("Error saving food:", error);
            alert("Database Error: " + (error.message || JSON.stringify(error)));
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Add Food</h2>

            {/* Search Bar */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFood()}
                    placeholder="Search for a food (e.g. Burger, Pizza)"
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-gray-800"
                />
                <button
                    onClick={searchFood}
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSearching ? '...' : 'Search'}
                </button>
            </div>

            {/* Search Results */}
            {results.length > 0 && !selectedFood && (
                <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 mt-2">
                    {results.map((food, index) => (
                        <li
                            key={index}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-gray-800 transition-colors"
                            onClick={() => {
                                setSelectedFood(food);
                                setQuantity(1); // Default to 1
                                setUnit('serving'); // Default to 'Serving' to make life easy
                            }}
                        >
                            <span className="capitalize font-medium">{food.name}</span>
                            <span className="text-sm text-gray-500">
                {food.caloriesPer100g} kcal / 100g
              </span>
                        </li>
                    ))}
                </ul>
            )}

            {/* The "Log this Food" Section with Unit Selector */}
            {selectedFood && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-blue-900 capitalize">{selectedFood.name}</h3>
                        <button
                            onClick={() => setSelectedFood(null)}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded-lg p-2 text-gray-800"
                        />

                        {/* The Magic Dropdown */}
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as 'g' | 'serving')}
                            className="border border-gray-300 rounded-lg p-2 text-gray-800 flex-1 cursor-pointer bg-white"
                        >
                            <option value="serving">
                                Serving / Item (approx. {selectedFood.servingSize}g)
                            </option>
                            <option value="g">Grams (g)</option>
                        </select>

                        <button
                            onClick={handleLogFood}
                            disabled={isSaving}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? 'Saving...' : 'Log It'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}