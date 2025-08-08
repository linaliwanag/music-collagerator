import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const CollageDisplay = ({ images, collageSize, type, attribution }) => {
  const gridSize = collageSize || 3;
  const gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  return (
    <div className="relative">
      {/* Main collage grid */}
      <div 
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns }}
      >
        {images.map((item, index) => (
          <div key={item.id} className="relative group">
            <Link href={item.spotifyUrl} target="_blank" rel="noopener noreferrer">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={item.imageUrl}
                  alt={`${type === 'tracks' ? item.name + ' by ' + item.artist : item.name}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm truncate">{item.name}</p>
                {type === 'tracks' && (
                  <p className="text-white/80 text-xs truncate">{item.artist}</p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Attribution footer */}
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-4">
          <Image
            src={attribution.spotifyLogo}
            alt="Spotify Logo"
            width={100}
            height={30}
            className="h-6 w-auto"
          />
          <p className="text-sm text-gray-600">{attribution.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

export default CollageDisplay; 