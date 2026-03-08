'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

// We pass refreshTrigger so the list knows when to re-fetch (after food is added)
// We pass onFoodDeleted so the dashboard knows to re-fetch the chart (after food is removed)
export default function DailyLogsList({
                                          refreshTrigger,
                                          onFoodDeleted
                                      }: {
    refreshTrigger: number,
    onFoodDeleted: () => void
}) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTodayLogs() {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];

            // Fetch logs AND the linked food_name using Supabase's automatic join syntax
            const { data, error } = await supabase
                .from('daily_logs')
                .select(`
          id,
          quantity_g,
          calories_consumed,
          food_dictionary ( food_name )
        `)
                .eq('user_id', user.id)
                .eq('date', today)
                .order('created_at', { ascending: false }); // Show newest food at the top

            if (data) setLogs(data);
            if (error) console.error("Error fetching logs:", error.message);

            setLoading(false);
        }

        fetchTodayLogs();
    }, [refreshTrigger]); // Re-run this effect whenever refreshTrigger changes

    const handleDelete = async (logId: string) => {
        // Delete the item from the database
        await supabase.from('daily_logs').delete().eq('id', logId);
        // Tell the dashboard to update the chart and this list
        onFoodDeleted();
    };

    if (loading) return <div className="text-center text-gray-500 py-4">Loading meals...</div>;

    if (logs.length === 0) return (
        <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            You haven't logged any food today. Time to eat!
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">Today's Meals</h2>
            </div>
            <ul className="divide-y divide-gray-100">
                {logs.map((log) => (
                    <li key={log.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-800 capitalize">
                                {log.food_dictionary?.food_name || 'Unknown Food'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {log.quantity_g}g
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
              <span className="font-bold text-blue-600">
                {log.calories_consumed.toFixed(0)} kcal
              </span>
                            <button
                                onClick={() => handleDelete(log.id)}
                                className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                                title="Remove entry"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}