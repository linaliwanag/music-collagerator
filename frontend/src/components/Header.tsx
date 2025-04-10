'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ClientOnly from './ClientOnly';

const Header = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-black text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-green-500 flex items-center">
          <svg 
            className="w-8 h-8 mr-2"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1.5-4.5l5-3-5-3v6z"/>
          </svg>
          Spotify Collage
        </Link>

        <nav className="flex items-center space-x-6">
          <ClientOnly>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="hover:text-green-500 transition">
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  {user?.images && user.images.length > 0 ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image 
                        src={user.images[0].url} 
                        alt={user.display_name || 'User'} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user?.display_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">{user?.display_name}</span>
                  <Link
                    href="/logout"
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
                  >
                    Logout
                  </Link>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
              >
                Login with Spotify
              </Link>
            )}
          </ClientOnly>
        </nav>
      </div>
    </header>
  );
};

export default Header; 