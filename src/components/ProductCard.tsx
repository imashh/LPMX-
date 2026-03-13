import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

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

    const message = `Hello LPMX, I want to order:

Product: ${product.name}
Product ID: ${product.product_id}
Price: NPR ${product.offer_price || product.price}`;

    window.open(`https://wa.me/9779808456469?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Link 
      to={`/product/${encodeURIComponent(product.product_id)}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {(product.show_sale_tag === 1 || product.show_sale_tag === true) && (
          <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Sale
          </div>
        )}
        <img 
          src={product.images?.[0] || 'https://picsum.photos/seed/shoe/400/500'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-[#0f1f3d]">
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
            className="w-full flex items-center justify-center bg-[#0f1f3d] text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-[#1a3366] transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
