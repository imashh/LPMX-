import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const heroBanners = banners.filter(b => b.position === 'hero' || !b.position);
  const hotDealsBanners = banners.filter(b => b.position === 'hot_deals');
  const mensBanners = banners.filter(b => b.position === 'mens');
  const womensBanners = banners.filter(b => b.position === 'womens');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const productsQuery = query(collection(db, 'products'), orderBy('created_at', 'desc'));
        const bannersQuery = query(collection(db, 'banners'), orderBy('sort_order', 'asc'));
        
        const [productsSnapshot, bannersSnapshot] = await Promise.all([
          getDocs(productsQuery),
          getDocs(bannersQuery)
        ]);
        
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const bannersData = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setProducts(productsData);
        setBanners(bannersData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f1f3d]"></div>
      </div>
    );
  }

  const hotDeals = products.filter(p => p.show_on_home === 1 || p.show_on_home === true).slice(0, 4);
  const mensCollection = products.filter(p => p.category === 'Men').slice(0, 8);
  const womensCollection = products.filter(p => p.category === 'Women').slice(0, 8);

  const renderSectionBanners = (sectionBanners: any[]) => {
    if (sectionBanners.length === 0) return null;
    return (
      <div className="w-full">
        <BannerSlider banners={sectionBanners} />
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-2 md:pb-4"
    >
      {/* Hero Banner Slider */}
      {heroBanners.length > 0 && (
        <BannerSlider banners={heroBanners} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-2 md:mb-4">
        {/* Hot Deals */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#0f1f3d] tracking-tight">Hot Deals</h2>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-2 text-[#0f1f3d] font-semibold hover:underline text-sm md:text-base">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {hotDeals.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
              {hotDeals.map(product => (
                <div key={product.product_id} className="min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-16px)] lg:min-w-[calc(25%-18px)] snap-start flex">
                  <ProductCard product={product} />
                </div>
              ))}
              <div className="min-w-[140px] md:min-w-[200px] flex items-center justify-center snap-start">
                <Link 
                  to="/catalogue" 
                  className="flex flex-col items-center gap-3 md:gap-4 text-[#0f1f3d] group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#0f1f3d] group-hover:text-white transition-all">
                    <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] md:text-sm">Browse Catalogue</span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
              No products available at the moment.
            </p>
          )}
        </section>
      </div>

      {renderSectionBanners(hotDealsBanners)}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-2 md:mb-4">
        {/* Men's Collection */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#0f1f3d] tracking-tight">Men's Collection</h2>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-2 text-[#0f1f3d] font-semibold hover:underline text-sm md:text-base">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {mensCollection.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
              {mensCollection.map(product => (
                <div key={product.product_id} className="min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-16px)] lg:min-w-[calc(25%-18px)] snap-start flex">
                  <ProductCard product={product} />
                </div>
              ))}
              <div className="min-w-[140px] md:min-w-[200px] flex items-center justify-center snap-start">
                <Link 
                  to="/catalogue" 
                  className="flex flex-col items-center gap-3 md:gap-4 text-[#0f1f3d] group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#0f1f3d] group-hover:text-white transition-all">
                    <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] md:text-sm">Browse Catalogue</span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
              No products available at the moment.
            </p>
          )}
        </section>
      </div>

      {renderSectionBanners(mensBanners)}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-0">
        {/* Women's Collection */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#0f1f3d] tracking-tight">Women's Collection</h2>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-2 text-[#0f1f3d] font-semibold hover:underline text-sm md:text-base">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {womensCollection.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
              {womensCollection.map(product => (
                <div key={product.product_id} className="min-w-[calc(50%-8px)] md:min-w-[calc(33.333%-16px)] lg:min-w-[calc(25%-18px)] snap-start flex">
                  <ProductCard product={product} />
                </div>
              ))}
              <div className="min-w-[140px] md:min-w-[200px] flex items-center justify-center snap-start">
                <Link 
                  to="/catalogue" 
                  className="flex flex-col items-center gap-3 md:gap-4 text-[#0f1f3d] group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#0f1f3d] group-hover:text-white transition-all">
                    <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] md:text-sm">Browse Catalogue</span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-gray-100">
              No products available at the moment.
            </p>
          )}
        </section>
      </div>
    </motion.div>
  );
}
