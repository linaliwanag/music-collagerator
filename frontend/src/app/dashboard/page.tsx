'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateCollage } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import ClientOnly from '@/components/ClientOnly';

type ItemType = 'artists' | 'tracks';
type TimeRange = 'short_term' | 'medium_term' | 'long_term';
type GridSize = '3x3' | '4x4' | '5x5';

interface CollageItem {
  name: string;
  imageUrl: string;
  artist?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading, isHydrated, clearAuthState, refreshTokenHandler } = useAuth();
  const [itemType, setItemType] = useState<ItemType>('artists');
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [limit, setLimit] = useState<number>(9);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collageItems, setCollageItems] = useState<CollageItem[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const collageRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Set limit based on grid size
    if (gridSize === '3x3') setLimit(9);
    if (gridSize === '4x4') setLimit(16);
    if (gridSize === '5x5') setLimit(25);
  }, [gridSize]);

  useEffect(() => {
    // Only check authentication status after hydration is complete
    if (isHydrated && !isLoading && !isAuthenticated) {
      toast.error('Please log in to access the dashboard');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, isHydrated]);

  useEffect(() => {
    // Your effect logic
  }, [clearAuthState, refreshTokenHandler]); // Add missing dependencies here

  const handleGenerateCollage = async () => {
    if (!accessToken) return;

    setIsGenerating(true);
    toast.loading('Generating your collage...', { id: 'generating' });

    try {
      const data = await generateCollage(
        accessToken,
        itemType,
        timeRange,
        limit,
        gridSize
      );

      setCollageItems(data.images);
      toast.success('Collage generated successfully!', { id: 'generating' });
    } catch (error) {
      console.error('Error generating collage:', error);
      toast.error('Failed to generate collage. Please try again.', { id: 'generating' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to wait for images to load
  const waitForImagesToLoad = async () => {
    if (!collageRef.current) return;
    
    // Get all images in the collage
    const images = collageRef.current.querySelectorAll('img');
    
    if (images.length === 0) {
      throw new Error('No images found in the collage');
    }
    
    console.log(`Waiting for ${images.length} images to load...`);
    
    // Create an array of promises that resolve when each image is loaded
    const imagePromises = Array.from(images).map(img => {
      // If image is already loaded, resolve immediately
      if (img.complete) return Promise.resolve();
      
      // Otherwise, create a promise that resolves on load or rejects on error
      return new Promise((resolve, reject) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', reject);
      });
    });
    
    // Wait for all images to load
    await Promise.all(imagePromises);
    console.log('All images loaded successfully');
  };

  // Add this helper function to create a simple canvas-based screenshot
  // This is a very basic fallback that will work in most browsers
  const createCanvasScreenshot = async (element: HTMLElement, fileName: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    // Set canvas dimensions to match the element
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Set black background
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert HTML to image using HTML5 Canvas
    const html = new XMLSerializer().serializeToString(element);
    const img = document.createElement('img');
    const svgBlob = new Blob([html], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        try {
          // Download the canvas as an image
          const link = document.createElement('a');
          link.download = fileName;
          link.href = canvas.toDataURL('image/png');
          link.click();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image onto canvas'));
      };
      
      img.src = url;
    });
  };

  const downloadCollage = async () => {
    if (!collageRef.current || collageItems.length === 0 || !isHydrated) return;
    
    if (isDownloading) return; // Prevent multiple clicks
    setIsDownloading(true);

    const toastId = toast.loading('Preparing download...', { id: 'download' });

    try {
      // First ensure all images are loaded
      try {
        await waitForImagesToLoad();
      } catch (error) {
        console.error('Error waiting for images to load:', error);
        toast.error('Some images failed to load. Download quality may be affected.', { id: toastId });
      }
      
      // Try multiple methods in sequence until one works
      
      // 1. Try html-to-image first (most reliable)
      try {
        console.log('Attempt 1: Using html-to-image');
        const htmlToImage = await import('html-to-image');
        
        try {
          console.log('Attempting to convert collage to PNG...');
          const dataUrl = await htmlToImage.toPng(collageRef.current, { 
            quality: 0.95,
            canvasWidth: collageItems.length <= 9 ? 1200 : 1600,
            canvasHeight: collageItems.length <= 9 ? 1200 : 1600,
            pixelRatio: 2,
            skipAutoScale: true,
            style: {
              'backgroundColor': '#000000'
            }
          });
          
          const link = document.createElement('a');
          link.download = `spotify-collage-${itemType}-${timeRange}.png`;
          link.href = dataUrl;
          link.click();
          
          toast.success('Collage downloaded!', { id: toastId });
          return; // Success - exit early
        } catch (pngError) {
          console.error('PNG conversion failed:', pngError);
          
          // Try JPEG instead
          try {
            console.log('Attempt 2: Using html-to-image with JPEG');
            const jpegDataUrl = await htmlToImage.toJpeg(collageRef.current, { 
              quality: 0.95,
              canvasWidth: collageItems.length <= 9 ? 1200 : 1600,
              canvasHeight: collageItems.length <= 9 ? 1200 : 1600,
              pixelRatio: 2,
              backgroundColor: '#000000'
            });
            
            const link = document.createElement('a');
            link.download = `spotify-collage-${itemType}-${timeRange}.jpg`;
            link.href = jpegDataUrl;
            link.click();
            
            toast.success('Collage downloaded as JPG!', { id: toastId });
            return; // Success - exit early
          } catch (jpegError) {
            console.error('JPEG conversion failed:', jpegError);
            // Continue to next method
          }
        }
      } catch (importError) {
        console.error('Failed to import html-to-image:', importError);
        // Continue to next method
      }
      
      // 2. Try dom-to-image as a fallback
      try {
        console.log('Attempt 3: Using dom-to-image');
        const domToImage = await import('dom-to-image');
        
        try {
          const dataUrl = await domToImage.toPng(collageRef.current, {
            bgcolor: '#000000',
            quality: 1.0,
            width: collageItems.length <= 9 ? 1200 : 1600,
            height: collageItems.length <= 9 ? 1200 : 1600,
          });
          
          const link = document.createElement('a');
          link.download = `spotify-collage-${itemType}-${timeRange}.png`;
          link.href = dataUrl;
          link.click();
          
          toast.success('Collage downloaded (using alternative method)!', { id: toastId });
          return; // Success - exit early
        } catch (domToImageError) {
          console.error('dom-to-image failed:', domToImageError);
          // Continue to next method
        }
      } catch (importError) {
        console.error('Failed to import dom-to-image:', importError);
        // Continue to next method
      }
      
      // 3. Last resort - try our simple canvas method
      try {
        console.log('Attempt 4: Using canvas fallback');
        await createCanvasScreenshot(
          collageRef.current, 
          `spotify-collage-${itemType}-${timeRange}.png`
        );
        toast.success('Collage downloaded (basic quality)!', { id: toastId });
        return; // Success - exit early
      } catch (canvasError) {
        console.error('Canvas fallback failed:', canvasError);
        // All methods have failed
        toast.error('All download methods failed. Please try in a different browser.', { id: toastId });
      }
      
    } catch (error) {
      console.error('Unexpected error in download process:', error);
      toast.error('Download failed due to an unexpected error.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const timeRangeLabels = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time'
  };

  const getGridCols = () => {
    if (gridSize === '3x3') return 'grid-cols-3';
    if (gridSize === '4x4') return 'grid-cols-4';
    return 'grid-cols-5';
  };

  // Show loading state during server render or before hydration is complete
  if (isLoading || !isHydrated) {
    return (
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white">
      <Header />
      
      <ClientOnly>
        <div className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Create Your Spotify Collage</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-700">Collage Options</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Content Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`py-2 px-4 rounded-md transition ${
                        itemType === 'artists' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setItemType('artists')}
                    >
                      Top Artists
                    </button>
                    <button
                      className={`py-2 px-4 rounded-md transition ${
                        itemType === 'tracks' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setItemType('tracks')}
                    >
                      Top Tracks
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Time Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(timeRangeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        className={`py-2 px-3 rounded-md text-sm transition ${
                          timeRange === value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setTimeRange(value as TimeRange)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Grid Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['3x3', '4x4', '5x5'] as GridSize[]).map((size) => (
                      <button
                        key={size}
                        className={`py-2 px-4 rounded-md transition ${
                          gridSize === size
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setGridSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={() => setShowLabels(!showLabels)}
                      className="rounded text-green-500 focus:ring-green-500"
                    />
                    <span>Show Labels</span>
                  </label>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleGenerateCollage}
                    disabled={isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Collage'}
                  </button>
                </div>
                
                {collageItems.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={downloadCollage}
                      disabled={isDownloading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? 'Preparing Download...' : 'Download Collage'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Collage Preview */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">
                  {collageItems.length > 0 ? 'Your Collage' : 'Collage Preview'}
                </h2>
                
                {collageItems.length > 0 ? (
                  <div 
                    ref={collageRef} 
                    className={`grid ${getGridCols()} gap-1 p-1 bg-black`}
                    style={{ backgroundColor: '#000000' }}
                  >
                    {collageItems.map((item, index) => (
                      <div key={index} className="relative aspect-square">
                        {item.imageUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                              crossOrigin="anonymous"
                              unoptimized={true}
                            />
                            {showLabels && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1 text-xs">
                                <p className="font-medium truncate">{item.name}</p>
                                {item.artist && (
                                  <p className="text-gray-300 text-xs truncate">{item.artist}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-square max-w-xl mx-auto flex items-center justify-center bg-gray-900 rounded">
                    <div className="text-center p-8">
                      <svg
                        className="w-16 h-16 text-gray-600 mx-auto mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium mb-2">No Collage Generated Yet</h3>
                      <p className="text-gray-400 mb-4">
                        Configure your options and click generate to create your collage
                      </p>
                      <button
                        onClick={handleGenerateCollage}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition text-sm"
                      >
                        Generate Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  );
} 