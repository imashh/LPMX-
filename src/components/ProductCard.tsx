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
  show_sale_tag: boolean | number;
}

export default function ProductCard({ product }: { product: Product }) {
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
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {(product.show_sale_tag === 1 || product.show_sale_tag === true) && (
          <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Sale
          </div>
        )}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img 
          src={product.images?.[0] || 'https://picsum.photos/seed/shoe/400/500'} 
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-accent">
            NPR {product.offer_price || product.price}
          </span>
          {product.offer_price && (
            <span className="text-xs text-gray-400 line-through">
              NPR {product.price}
            </span>
          )}
        </div>
        
        <div className="mt-auto">
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center justify-center bg-accent text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
