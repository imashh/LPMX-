import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage } from '../../lib/imageCompression';

export default function ManageBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const q = query(collection(db, 'banners'), orderBy('sort_order', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBanners(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // Allow up to 10MB for banners before compression
        toast.error('Image exceeds 10MB limit');
        return;
      }
      
      const loadingToast = toast.loading('Compressing banner...');
      try {
        // Banners might need higher quality/resolution, so target 300KB and 1920px max width
        const compressedFile = await compressImage(file, 300, 1920, 1080);
        setImage(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        toast.success('Banner compressed and ready', { id: loadingToast });
      } catch (error) {
        console.error("Compression error:", error);
        toast.error('Failed to compress banner', { id: loadingToast });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error('Please select an image');
      return;
    }

    const loadingToast = toast.loading('Uploading banner...');
    try {
      const storageRef = ref(storage, `banners/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'banners'), {
        title: title || '',
        image_url: imageUrl,
        sort_order: parseInt(sortOrder) || 0,
        created_at: serverTimestamp()
      });

      toast.success('Banner added successfully', { id: loadingToast });
      setIsAdding(false);
      setTitle('');
      setSortOrder('0');
      setImage(null);
      setImagePreview(null);
      fetchBanners();
    } catch (error: any) {
      console.error("Banner upload error:", error);
      let errorMessage = 'Failed to add banner';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Storage permission denied. Please check storage rules.';
      } else if (error.message?.includes('permission-denied')) {
        errorMessage = 'Firestore permission denied. Please check firestore rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    const confirmDelete = () => {
      toast.dismiss();
      performDelete(id, imageUrl);
    };

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Are you sure you want to delete this banner?</p>
        <div className="flex gap-2">
          <button
            onClick={confirmDelete}
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const performDelete = async (id: string, imageUrl: string) => {
    const loadingToast = toast.loading('Deleting banner...');
    try {
      // Try to delete image from storage if it's a firebase storage URL
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.error("Failed to delete image from storage", e);
        }
      }

      await deleteDoc(doc(db, 'banners', id));
      toast.success('Banner deleted', { id: loadingToast });
      fetchBanners();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete banner', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Banners</h1>
          <p className="mt-2 text-sm text-gray-500">Add or remove promotional banners for the homepage.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
              <h2 className="text-xl font-semibold mb-6">Add New Banner</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title (Optional)</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input type="number" required value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Banner Image (Max 10MB - will be compressed to ~300KB WebP)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  
                  {imagePreview && (
                    <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-gray-200 mt-4">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                    Save Banner
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
            <div className="relative aspect-video bg-gray-100">
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => handleDelete(banner.id, banner.image_url)} className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">{banner.title || 'Untitled Banner'}</h3>
              <p className="text-sm text-gray-500 mt-1">Order: {banner.sort_order}</p>
            </div>
          </div>
        ))}
        {banners.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500 text-lg">No banners found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
