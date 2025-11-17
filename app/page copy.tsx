"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'user' | 'client'>('user');
  
  const [userLogin, setUserLogin] = useState({
    email: '',
    password: ''
  });

  const [clientLogin, setClientLogin] = useState({
    email: '',
    client_key: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async () => {
    setError('');
    
    if (!userLogin.email || !userLogin.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userLogin.email,
        password: userLogin.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Success - will be handled by auth state change in parent
      router.push('/');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleClientLogin = async () => {
    setError('');
    
    if (!clientLogin.email || !clientLogin.client_key) {
      setError('Email and client key are required');
      return;
    }

    setLoading(true);

    try {
      // Verify client exists with matching email and key
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_email', clientLogin.email)
        .eq('client_key', clientLogin.client_key)
        .single();

      if (clientError || !clientData) {
        setError('Invalid email or client key');
        setLoading(false);
        return;
      }

      // Store client info in session storage for client view
      sessionStorage.setItem('client_data', JSON.stringify(clientData));
      
      // Navigate to client jobs page
      router.push(`/client_jobs?client_key=${clientData.client_key}`);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'user' | 'client') => {
    if (e.key === 'Enter') {
      if (type === 'user') {
        handleUserLogin();
      } else {
        handleClientLogin();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="border border-white p-16 w-full max-w-5xl">
        {/* Error Message */}
        {error && (
          <div className="border border-red-500 bg-red-500/10 text-red-500 p-4 text-center mb-8">
            {error}
          </div>
        )}

        {/* Tab Headers */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <button
            onClick={() => {
              setActiveTab('user');
              setError('');
            }}
            className={`border border-white rounded-lg p-6 text-xl transition-colors ${
              activeTab === 'user' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
            }`}
          >
            User Login
          </button>
          <button
            onClick={() => {
              setActiveTab('client');
              setError('');
            }}
            className={`border border-white rounded-lg p-6 text-xl transition-colors ${
              activeTab === 'client' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
            }`}
          >
            Client Login
          </button>
        </div>

        {/* Login Forms */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          {/* User Login Form */}
          <div className="space-y-6">
            <input
              type="email"
              value={userLogin.email}
              onChange={(e) => setUserLogin({ ...userLogin, email: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, 'user')}
              placeholder="email"
              disabled={loading}
              className="w-full bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
            <input
              type="password"
              value={userLogin.password}
              onChange={(e) => setUserLogin({ ...userLogin, password: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, 'user')}
              placeholder="password"
              disabled={loading}
              className="w-full bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
          </div>

          {/* Client Login Form */}
          <div className="space-y-6">
            <input
              type="email"
              value={clientLogin.email}
              onChange={(e) => setClientLogin({ ...clientLogin, email: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, 'client')}
              placeholder="email"
              disabled={loading}
              className="w-full bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
            <input
              type="text"
              value={clientLogin.client_key}
              onChange={(e) => setClientLogin({ ...clientLogin, client_key: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, 'client')}
              placeholder="client_key"
              disabled={loading}
              className="w-full bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={activeTab === 'user' ? handleUserLogin : handleClientLogin}
            disabled={loading}
            className="border border-white rounded-lg px-16 py-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'log in button'}
          </button>
          {activeTab === 'user' && (
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="border border-white rounded-lg px-12 py-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              user sign-up button
            </button>
          )}
        </div>
      </div>
    </div>
  );
}