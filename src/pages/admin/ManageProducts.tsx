import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage } from '../../lib/imageCompression';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

export default function ManageProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    offer_price: '',
    description: '',
    sizes: '',
    category: 'None',
    show_on_home: false,
    show_sale_tag: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch products');
      try {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } catch (e) {
        // Ignore throw
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      offer_price: product.offer_price ? product.offer_price.toString() : '',
      description: product.description || '',
      sizes: product.sizes,
      category: product.category || 'None',
      show_on_home: product.show_on_home === true || product.show_on_home === 1,
      show_sale_tag: product.show_sale_tag === true || product.show_sale_tag === 1,
    });
    setExistingImages(product.images || []);
    setDeletedImages([]);
    setImages([]);
    setImagePreviews([]);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + newFiles.length > 6) {
        toast.error('Maximum 6 images allowed');
        return;
      }
      
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) { // Increased limit to 5MB before compression to allow high quality
          toast.error(`${file.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      });

      const loadingToast = toast.loading('Compressing images...');
      try {
        const compressedFiles = await Promise.all(
          validFiles.map(file => compressImage(file, 200)) // Compress to ~200KB WebP
        );

        setImages(prev => [...prev, ...compressedFiles]);
        
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        toast.success('Images compressed and ready', { id: loadingToast });
      } catch (error) {
        console.error("Compression error:", error);
        toast.error('Failed to compress images', { id: loadingToast });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    const imageUrl = existingImages[index];
    if (imageUrl) {
      setDeletedImages(prev => [...prev, imageUrl]);
    }
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loadingToast = toast.loading(editingProduct ? 'Updating product...' : 'Uploading product...');
    try {
      let productId = editingProduct?.product_id;
      
      if (!editingProduct) {
        // Generate Product ID for new product
        let nextIdNum = 1;
        if (products.length > 0) {
          const lastProduct = products[0]; // Assuming ordered by created_at desc
          const match = lastProduct.product_id?.match(/#026(\d{4})/);
          if (match) nextIdNum = parseInt(match[1], 10) + 1;
        }
        productId = `#026${nextIdNum.toString().padStart(4, '0')}`;
      }

      // Upload new images
      const newImageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const storageRef = ref(storage, `products/${productId}_${Date.now()}_${i}`);
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        newImageUrls.push(url);
      }

      const finalImages = [...existingImages, ...newImageUrls];

      // Delete images that were removed from the product
      if (deletedImages.length > 0) {
        for (const imageUrl of deletedImages) {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (e) {
              console.error("Failed to delete removed image from storage", e);
            }
          }
        }
      }

      const price = parseFloat(formData.price);
      const offerPrice = formData.offer_price ? parseFloat(formData.offer_price) : null;

      if (isNaN(price)) {
        toast.error('Invalid price');
        toast.dismiss(loadingToast);
        return;
      }

      if (formData.offer_price && isNaN(offerPrice as number)) {
        toast.error('Invalid offer price');
        toast.dismiss(loadingToast);
        return;
      }

      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: price,
        offer_price: offerPrice,
        sizes: formData.sizes,
        category: formData.category,
        show_on_home: formData.show_on_home,
        show_sale_tag: formData.show_sale_tag,
        images: finalImages,
      };

      if (editingProduct) {
        await setDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          updated_at: serverTimestamp()
        }, { merge: true });
        toast.success('Product updated successfully', { id: loadingToast });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          product_id: productId,
          views: 0,
          whatsapp_clicks: 0,
          created_at: serverTimestamp()
        });
        toast.success('Product added successfully', { id: loadingToast });
      }

      setIsAdding(false);
      setEditingProduct(null);
      setFormData({
        name: '', price: '', offer_price: '', description: '', sizes: '',
        category: 'None', show_on_home: false, show_sale_tag: false
      });
      setImages([]);
      setImagePreviews([]);
      setExistingImages([]);
      setDeletedImages([]);
      fetchProducts();
    } catch (error: any) {
      console.error("Upload error:", error);
      
      let errorMessage = editingProduct ? 'Failed to update product' : 'Failed to add product';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Storage permission denied. Please check storage rules.';
      } else if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
        errorMessage = 'Firestore permission denied. Please check firestore rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: loadingToast });

      try {
        handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, editingProduct ? `products/${editingProduct.id}` : 'products');
      } catch (e) {
        // Ignore the throw from handleFirestoreError so we don't crash the UI
      }
    }
  };

  const handleDelete = async (product: any) => {
    // Using toast for confirmation instead of window.confirm
    const confirmDelete = () => {
      toast.dismiss();
      performDelete(product);
    };

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Are you sure you want to delete this product?</p>
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

  const performDelete = async (product: any) => {
    const loadingToast = toast.loading('Deleting product...');
    try {
      // Collect all image URLs from the product
      const allImages: string[] = [...(product.images || [])];
      
      // Also check for color variations images (in case they exist in the DB)
      if (product.color_variations && Array.isArray(product.color_variations)) {
        product.color_variations.forEach((v: any) => {
          if (v.images && Array.isArray(v.images)) {
            allImages.push(...v.images);
          }
        });
      }

      // Delete images from storage
      if (allImages.length > 0) {
        for (const imageUrl of allImages) {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (e) {
              console.error("Failed to delete image from storage", e);
            }
          }
        }
      }

      await deleteDoc(doc(db, 'products', product.id));
      toast.success('Product deleted', { id: loadingToast });
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product', { id: loadingToast });
      try {
        handleFirestoreError(error, OperationType.DELETE, `products/${product.id}`);
      } catch (e) {
        // Ignore throw
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.product_id && p.product_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Products</h1>
          <p className="mt-2 text-sm text-gray-500">Add, edit, or remove products from your catalogue.</p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingProduct(null);
              setFormData({
                name: '', price: '', offer_price: '', description: '', sizes: '',
                category: 'None', show_on_home: false, show_sale_tag: false
              });
              setImages([]);
              setImagePreviews([]);
              setExistingImages([]);
              setDeletedImages([]);
            } else {
              setIsAdding(true);
            }
          }}
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'Add Product'}
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
              <h2 className="text-xl font-semibold mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent">
                      <option value="None">None (Default)</option>
                      <option value="Men">Men's Collection</option>
                      <option value="Women">Women's Collection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (Optional)</label>
                    <input type="number" value={formData.offer_price} onChange={e => setFormData({...formData, offer_price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated, e.g., 39,40,41)</label>
                    <input type="text" required value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent"></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Main Images (Max 6, up to 5MB each - will be compressed to ~200KB WebP)</label>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    {/* Existing Images */}
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* New Image Previews */}
                    {imagePreviews.map((preview, idx) => (
                      <div key={`new-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-blue-200">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1 rounded">NEW</div>
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.show_on_home} onChange={e => setFormData({...formData, show_on_home: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#0f1f3d] focus:ring-[#0f1f3d]" />
                    <span className="text-sm font-medium text-gray-700">Show in Hot Deals</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.show_sale_tag} onChange={e => setFormData({...formData, show_sale_tag: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#0f1f3d] focus:ring-[#0f1f3d]" />
                    <span className="text-sm font-medium text-gray-700">Show "SALE" Tag</span>
                  </label>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0f1f3d] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium">WA Clicks</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={product.images?.[0] || 'https://picsum.photos/seed/shoe/100/100'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{product.product_id}</td>
                  <td className="px-6 py-4 font-medium text-[#0f1f3d]">NPR {product.offer_price || product.price}</td>
                  <td className="px-6 py-4 text-gray-500">{product.views || 0}</td>
                  <td className="px-6 py-4 text-gray-500">{product.whatsapp_clicks || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/product/${encodeURIComponent(product.product_id)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </a>
                      <button onClick={() => handleEdit(product)} className="text-amber-500 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(product)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
