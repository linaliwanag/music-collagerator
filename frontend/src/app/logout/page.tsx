'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    // Only process logout after hydration is complete
    if (!isHydrated) return;
    
    const handleLogout = async () => {
      if (isAuthenticated) {
        await logout();
      } else {
        // If already logged out, just redirect to home
        router.push('/');
      }
    };

    handleLogout();
  }, [logout, router, isAuthenticated, isHydrated]);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold mb-2">Logging Out</h1>
          <p className="text-gray-300">Please wait while we log you out...</p>
        </div>
      </div>
    </main>
  );
} 