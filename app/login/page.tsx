'use client'; // This tells Next.js this is an interactive client component

import { useState } from 'react';
import { supabase } from '@/utils/supabase'; // Adjust path if your utils folder is elsewhere
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    // Handle User Registration
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMessage(`❌ Error: ${error.message}`);
        } else {
            setMessage('✅ Success! Please login to your account.');
        }
        setLoading(false);
    };

    // Handle User Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage(`❌ Error: ${error.message}`);
        } else {
            setMessage('✅ Logged in! Redirecting to dashboard...');
            // Redirect the user to their dashboard after a successful login
            router.push('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">Calorie Tracker</h2>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {message && <p className="text-sm text-center font-medium">{message}</p>}

                    <div className="flex space-x-4 pt-2">
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Processing...' : 'Log In'}
                        </button>
                        <button
                            onClick={handleSignUp}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}