'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
    const [goal, setGoal] = useState<number>(2000);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchSettings() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/login');

            const { data } = await supabase
                .from('user_settings')
                .select('daily_calorie_goal')
                .eq('id', user.id)
                .single();

            if (data) setGoal(data.daily_calorie_goal);
            setLoading(false);
        }
        fetchSettings();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('user_settings')
            .upsert({ id: user?.id, daily_calorie_goal: goal });

        if (error) alert("Error saving goal");
        else router.push('/dashboard');
        setSaving(false);
    };

    if (loading) return <div className="p-10 text-center">Loading settings...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Calorie Goal</label>
                    <input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Goal'}
                    </button>
                    <Link href="/dashboard" className="flex-1 text-center py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50">
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}