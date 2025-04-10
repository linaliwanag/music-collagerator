import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="w-full lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-green-500">Visualize</span> Your Spotify Listening History
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Create beautiful collages from your favorite artists and albums. Share your music taste with the world.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
              >
                Create Your Collage
              </Link>
            </div>
            <div className="pt-6 text-gray-400 text-sm space-y-2">
              <p>✓ Top artists & tracks visualization</p>
              <p>✓ Customizable time periods</p>
              <p>✓ Multiple grid layouts</p>
              <p>✓ Download & share your collages</p>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative">
            <div className="aspect-square max-w-md mx-auto grid grid-cols-3 gap-2 p-2 bg-gray-800 rounded-lg shadow-xl transform rotate-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-gray-700 rounded-md overflow-hidden"
                >
                  {/* This would be replaced with actual album artwork */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-black py-6 text-center text-gray-400">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Spotify Collage Generator. Not affiliated with Spotify.</p>
        </div>
      </footer>
    </main>
  );
}
