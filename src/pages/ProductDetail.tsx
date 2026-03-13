import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        const q = query(collection(db, 'products'), where('product_id', '==', id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setProduct(data);
          
          if (data.sizes) {
            const sizes = data.sizes.split(',');
            if (sizes.length > 0) setSelectedSize(sizes[0].trim());
          }
          
          // Track view
          await updateDoc(doc(db, 'products', docSnap.id), {
            views: increment(1)
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f1f3d]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Product not found.</p>
      </div>
    );
  }

  const sizes = product.sizes ? product.sizes.split(',').map((s: string) => s.trim()) : [];
  const images = product.images || [];

  const handleWhatsAppClick = async () => {
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
Size: ${selectedSize}
Price: NPR ${product.offer_price || product.price}`;

    window.open(`https://wa.me/9779808456469?text=${encodeURIComponent(message)}`, '_blank');
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Image Gallery */}
        <div className="space-y-6">
          {/* Mobile Swipeable Gallery */}
          <div className="lg:hidden relative w-full aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
            {images.length > 0 ? (
              <div className="flex w-full h-full snap-x snap-mandatory overflow-x-auto scrollbar-hide" onScroll={(e) => {
                const scrollLeft = (e.target as HTMLElement).scrollLeft;
                const width = (e.target as HTMLElement).clientWidth;
                setCurrentImage(Math.round(scrollLeft / width));
              }}>
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="min-w-full h-full snap-center">
                    <img src={img} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No image available</div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <div key={idx} className={cn("w-2 h-2 rounded-full transition-all", currentImage === idx ? "bg-[#0f1f3d] w-4" : "bg-gray-300")} />
                ))}
              </div>
            )}
          </div>

          {/* Desktop Gallery */}
          <div className="hidden lg:block relative aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[currentImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronLeft className="w-6 h-6 text-[#0f1f3d]" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronRight className="w-6 h-6 text-[#0f1f3d]" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery (Desktop) */}
          {images.length > 1 && (
            <div className="hidden lg:flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={cn(
                    "relative w-24 aspect-square rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                    currentImage === idx ? "border-[#0f1f3d]" : "border-transparent hover:border-gray-200"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500 mb-3 tracking-widest uppercase">
              {product.product_id}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0f1f3d] tracking-tight mb-6">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-bold text-[#0f1f3d]">
                NPR {product.offer_price || product.price}
              </span>
              {product.offer_price && (
                <span className="text-xl text-gray-400 line-through">
                  NPR {product.price}
                </span>
              )}
            </div>
            
            <div className="prose prose-lg text-gray-600 mb-10 leading-relaxed">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-semibold text-[#0f1f3d] uppercase tracking-wider mb-4">Select Size</h3>
            <div className="flex flex-wrap gap-3">
              {sizes.map((size: string) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-medium transition-all duration-200",
                    selectedSize === size
                      ? "bg-[#0f1f3d] text-white shadow-lg shadow-[#0f1f3d]/20 scale-105"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-[#0f1f3d] hover:text-[#0f1f3d]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-gray-100">
            <button
              onClick={handleWhatsAppClick}
              className="w-full flex items-center justify-center bg-[#25D366] text-white py-5 px-8 rounded-2xl text-lg font-semibold hover:bg-[#128C7E] transition-all duration-300 shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 hover:-translate-y-1"
            >
              Buy Now
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Clicking this will open WhatsApp with a pre-filled message.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
