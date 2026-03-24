import { useState, useEffect } from 'react';

export default function BannerSlider({ banners }: { banners: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
      <div 
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ 
          width: `${banners.length * 100}%`,
          transform: `translateX(-${currentIndex * (100 / banners.length)}%)` 
        }}
      >
        {banners.map((banner, index) => (
          <div 
            key={banner.id} 
            className="h-full relative flex-shrink-0"
            style={{ width: `${100 / banners.length}%` }}
          >
            <img 
              src={banner.image_url} 
              alt={banner.title || 'Banner'} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              decoding={index === 0 ? "sync" : "async"}
            />
            {banner.title && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <h2 className="text-2xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg px-4 text-center">
                  {banner.title}
                </h2>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Banner Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'bg-white w-6 md:w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
