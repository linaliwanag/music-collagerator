'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUrl } from '@/utils/api';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { isHydrated } = useAuth();

  useEffect(() => {
    // Only initiate login after hydration is complete
    if (!isHydrated) return;
    
    const initiateLogin = async () => {
      try {
        const authUrl = await getAuthUrl();
        // Redirect to Spotify for authentication
        window.location.href = authUrl;
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Failed to connect to Spotify. Please try again.');
        router.push('/');
      }
    };

    initiateLogin();
  }, [router, isHydrated]);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold mb-2">Connecting to Spotify</h1>
          <p className="text-gray-300">Redirecting you to Spotify for authentication...</p>
        </div>
      </div>
    </main>
  );
} 