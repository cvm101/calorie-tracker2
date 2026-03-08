'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Imports the default calendar styles
import Link from 'next/link';

export default function HistoryPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [logs, setLogs] = useState<any[]>([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [loading, setLoading] = useState(true);
    const [calorieGoal] = useState(2000); // Default goal
    const router = useRouter();

    // Helper function to safely get YYYY-MM-DD for the database query
    const formatToYMD = (dateObj: Date) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const dateStr = formatToYMD(selectedDate);

            // Fetch logs for the selected date
            const { data, error } = await supabase
                .from('daily_logs')
                .select(`
          id,
          quantity_g,
          calories_consumed,
          food_dictionary ( food_name )
        `)
                .eq('user_id', session.user.id)
                .eq('date', dateStr);

            if (data) {
                setLogs(data);
                const total = data.reduce((sum, log) => sum + log.calories_consumed, 0);
                setTotalCalories(total);
            }

            setLoading(false);
        }

        fetchHistory();
    }, [selectedDate, router]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Navigation & Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">History</h1>
                        <p className="text-gray-500">Review your past meals</p>
                    </div>
                    <Link href="/dashboard" className="text-blue-600 font-medium hover:underline">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row gap-6">

                    {/* Calendar Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm w-full md:w-auto flex justify-center h-fit">
                        {/* We override some default react-calendar styles to make it look modern */}
                        <div className="calendar-container">
                            <Calendar
                                onChange={(value) => setSelectedDate(value as Date)}
                                value={selectedDate}
                                className="border-none rounded-lg font-sans"
                            />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 bg-white p-6 rounded-xl shadow-sm space-y-6">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">
                                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h2>

                            <div className="flex justify-between mt-4">
                                <span className="text-gray-600">Goal: <span className="font-bold text-gray-800">{calorieGoal} kcal</span></span>
                                <span className="text-gray-600">Consumed: <span className={`font-bold ${totalCalories > calorieGoal ? 'text-red-500' : 'text-blue-600'}`}>{totalCalories.toFixed(0)} kcal</span></span>
                            </div>
                        </div>

                        {/* Past Meals List */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3">Meals Logged</h3>

                            {loading ? (
                                <p className="text-gray-500">Loading meals...</p>
                            ) : logs.length === 0 ? (
                                <p className="text-gray-400 italic">No food logged on this date.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {logs.map((log) => (
                                        <li key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold capitalize text-gray-800">
                                                    {log.food_dictionary?.food_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">{log.quantity_g}g</p>
                                            </div>
                                            <span className="font-bold text-gray-700">{log.calories_consumed.toFixed(0)} kcal</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}