import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useSettings } from '../contexts/SettingsContext';

interface Product {
  id?: string;
  product_id: string;
  name: string;
  price: number;
  offer_price: number | null;
  images: string[];
  thumbnails?: string[];
  show_sale_tag: boolean | number;
}

export default function ProductCard({ product, priority = false }: { product: Product, priority?: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { whatsappTemplate } = useSettings();

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Track click
    try {
      if (product.id) {
        await updateDoc(doc(db, 'products', product.id), {
          whatsapp_clicks: increment(1)
        });
      }
    } catch (err) {
      console.error('Failed to track click', err);
    }

    const productUrl = `${window.location.origin}/product/${encodeURIComponent(product.product_id)}`;
    
    const message = whatsappTemplate
      .replace(/{product_name}/g, product.name)
      .replace(/{product_id}/g, product.product_id)
      .replace(/{price}/g, (product.offer_price || product.price).toString())
      .replace(/{size_info}/g, '') // No size selected from card
      .replace(/{url}/g, productUrl)
      .replace(/\n\s*\n/g, '\n\n'); // Clean up empty lines if {size_info} leaves a gap

    window.open(`https://wa.me/9779808456469?text=${encodeURIComponent(message.trim())}`, '_blank');
  };

  return (
    <Link 
      to={`/product/${encodeURIComponent(product.product_id)}`}
      className="group flex flex-col h-full w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {(product.show_sale_tag === 1 || product.show_sale_tag === true) && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase tracking-wider">
            Sale
          </div>
        )}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img 
          src={product.thumbnails?.[0] || product.images?.[0] || 'https://picsum.photos/seed/shoe/400/500'} 
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onLoad={() => setImageLoaded(true)}
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">{product.name}</h3>
        
        <div className="flex flex-col gap-0.5 mb-3 md:mb-4">
          {product.offer_price ? (
            <>
              <span className="text-[11px] md:text-xs text-gray-500 line-through">
                NPR {product.price}
              </span>
              <span className="text-base md:text-lg font-bold text-accent">
                NPR {product.offer_price}
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] md:text-xs text-transparent select-none">
                Spacer
              </span>
              <span className="text-base md:text-lg font-bold text-accent">
                NPR {product.price}
              </span>
            </>
          )}
        </div>
        
        <div className="mt-auto">
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center justify-center bg-accent text-white py-2 px-2 md:py-2.5 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
