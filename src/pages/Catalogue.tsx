import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function Catalogue() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProducts = async () => {
      try {
        // Limit to 100 products for initial load to keep it fast
        const q = query(collection(db, 'products'), orderBy('created_at', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.product_id && product.product_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-[#0f1f3d] tracking-tight mb-4">Full Catalogue</h1>
          <p className="text-gray-500 text-lg">Browse our complete collection of premium footwear.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-500 text-lg">
            {searchTerm ? `No products found matching "${searchTerm}"` : "No products available at the moment."}
          </p>
        </div>
      )}
    </motion.div>
  );
}
