'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <-- Added Link for navigation
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import FoodSearch from '@/components/FoodSearch';
import DailyLogsList from '@/components/DailyLogsList';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [caloriesConsumed, setCaloriesConsumed] = useState(0);
    const [calorieGoal, setCalorieGoal] = useState(2000); // Default goal
    const [loading, setLoading] = useState(true);

    // State to trigger a re-fetch when food is added or deleted
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const router = useRouter();

    useEffect(() => {
        async function fetchDashboardData() {
            // 1. Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            setUser(session.user);

            // 2. Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // 3. Fetch all foods eaten TODAY for this user
            const { data: logs, error } = await supabase
                .from('daily_logs')
                .select('calories_consumed')
                .eq('user_id', session.user.id)
                .eq('date', today);

            if (logs) {
                // Add up all the calories consumed today
                const total = logs.reduce((sum, log) => sum + log.calories_consumed, 0);
                setCaloriesConsumed(total);
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, [router, refreshTrigger]); // Re-runs when refreshTrigger changes

    if (loading) return <div className="text-center mt-20 text-xl font-bold">Loading your dashboard...</div>;

    // Calculate data for our chart
    const caloriesLeft = Math.max(calorieGoal - caloriesConsumed, 0);
    const chartData = [
        { name: 'Consumed', value: caloriesConsumed },
        { name: 'Remaining', value: caloriesLeft },
    ];
    const COLORS = ['#3B82F6', '#E5E7EB'];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Today's Overview</h1>
                        <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/history" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                            📅 View History
                        </Link>
                        <button
                            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
                            className="text-sm text-red-500 hover:underline transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Chart & Stats Section */}
                <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* The Donut Chart */}
                    <div className="h-48 w-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Text inside the donut chart */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-800">{caloriesLeft.toFixed(0)}</span>
                            <span className="text-xs text-gray-500 uppercase">Left</span>
                        </div>
                    </div>

                    {/* Stats Details */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Daily Goal</span>
                            <span className="font-bold">{calorieGoal} kcal</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-blue-600 font-medium">Consumed</span>
                            <span className="font-bold">{caloriesConsumed.toFixed(0)} kcal</span>
                        </div>
                    </div>
                </div>

                {/* The Smart Food Search Component */}
                <FoodSearch onFoodLogged={() => setRefreshTrigger(prev => prev + 1)} />

                {/* The Daily Logs List Component */}
                <DailyLogsList
                    refreshTrigger={refreshTrigger}
                    onFoodDeleted={() => setRefreshTrigger(prev => prev + 1)}
                />

            </div>
        </div>
    );
}