'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback, getUserProfile } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import ClientOnly from '@/components/ClientOnly';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthTokens, setUser, isHydrated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only process the callback after hydration is complete
    if (!isHydrated || isProcessing) return;

    const processCallback = async () => {
      setIsProcessing(true);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        console.error('Authentication error from Spotify:', errorParam);
        setError(`Authentication failed: ${errorParam}`);
        toast.error(`Authentication failed: ${errorParam}`);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        setError('No authorization code received');
        toast.error('No authorization code received');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        console.log('Processing callback with code...');
        // Exchange code for tokens
        const authData = await handleCallback(code);
        
        console.log('Setting auth tokens...');
        setAuthTokens(authData.accessToken, authData.expiresIn);

        try {
          // Fetch user profile
          console.log('Fetching user profile...');
          const profile = await getUserProfile(authData.accessToken);
          setUser(profile);
          toast.success('Successfully logged in!');
          router.push('/dashboard');
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Even if profile fetch fails, we have tokens so consider login successful
          toast.success('Successfully logged in!');
          // Give the toast time to show before redirecting
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        
        let errorMessage = 'Failed to complete authentication';
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push('/'), 3000);
      }
    };

    processCallback();
  }, [searchParams, router, setAuthTokens, setUser, isHydrated, isProcessing]);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
      <Header />
      
      <ClientOnly>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            {error ? (
              <>
                <div className="text-red-500 text-5xl mb-6">❌</div>
                <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
                <p className="text-gray-300 mb-4">{error}</p>
                <p className="text-gray-400">Redirecting you to the home page...</p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-6"></div>
                <h1 className="text-2xl font-bold mb-2">Finishing Authentication</h1>
                <p className="text-gray-300">Please wait while we complete the login process...</p>
              </>
            )}
          </div>
        </div>
      </ClientOnly>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
} 