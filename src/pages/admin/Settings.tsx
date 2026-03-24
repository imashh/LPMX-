import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Save, Image as ImageIcon, MessageCircle, Users, UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage } from '../../firebase';
import { doc, setDoc, collection, getDocs, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useSettings } from '../../contexts/SettingsContext';
import { compressImage } from '../../lib/imageCompression';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

export default function Settings() {
  const { logoUrl, whatsappTemplate } = useSettings();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  
  const [templateInput, setTemplateInput] = useState(whatsappTemplate);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const defaultAdmins = [
    'grafiqo.np@gmail.com',
    'simplex.ktm@gmail.com',
    'v.divash@gmail.com',
    'vivek.nepal@gmail.com'
  ];

  useEffect(() => {
    setTemplateInput(whatsappTemplate);
  }, [whatsappTemplate]);

  const handleResetWebsite = async () => {
    setIsResetting(true);
    const loadingToast = toast.loading('Resetting website data...');
    try {
      // 1. Delete all products and their images
      const productsSnapshot = await getDocs(collection(db, 'products'));
      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        const images = product.images || [];
        
        // Delete images from storage
        for (const imageUrl of images) {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (e: any) {
              if (e.code !== 'storage/object-not-found') {
                console.error("Failed to delete product image", e);
              }
            }
          }
        }
        
        // Delete document
        await deleteDoc(doc(db, 'products', productDoc.id));
      }

      // 2. Delete all banners and their images
      const bannersSnapshot = await getDocs(collection(db, 'banners'));
      for (const bannerDoc of bannersSnapshot.docs) {
        const banner = bannerDoc.data();
        const imageUrl = banner.image_url;
        
        if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (e: any) {
            if (e.code !== 'storage/object-not-found') {
              console.error("Failed to delete banner image", e);
            }
          }
        }
        
        // Delete document
        await deleteDoc(doc(db, 'banners', bannerDoc.id));
      }

      // 3. Reset site settings
      // Delete old logo if it exists
      if (logoUrl && logoUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const oldLogoRef = ref(storage, logoUrl);
          await deleteObject(oldLogoRef);
        } catch (e: any) {
          if (e.code !== 'storage/object-not-found') {
            console.error("Failed to delete old logo", e);
          }
        }
      }

      await deleteDoc(doc(db, 'settings', 'site_settings'));

      toast.success('Website reset successfully!', { id: loadingToast });
      setIsResetModalOpen(false);
      // Refresh page to clear local states
      window.location.reload();
    } catch (error) {
      console.error("Error resetting website:", error);
      toast.error('Failed to reset website', { id: loadingToast });
    } finally {
      setIsResetting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveLogo = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to upload.');
      return;
    }

    setIsSavingLogo(true);
    try {
      // Compress image to ~50KB for faster loading
      const compressedImage = await compressImage(selectedImage, 50, 400, 400);

      // Upload new logo to Firebase Storage
      const storageRef = ref(storage, `settings/logo_${Date.now()}_${compressedImage.name}`);
      await uploadBytes(storageRef, compressedImage);
      const downloadUrl = await getDownloadURL(storageRef);

      // Delete old logo if it exists and is a firebase storage URL
      if (logoUrl && logoUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const oldLogoRef = ref(storage, logoUrl);
          await deleteObject(oldLogoRef);
        } catch (e: any) {
          if (e.code !== 'storage/object-not-found') {
            console.error("Failed to delete old logo from storage", e);
          }
        }
      }

      // Save URL to Firestore
      await setDoc(doc(db, 'settings', 'site_settings'), {
        logo_url: downloadUrl,
        updated_at: serverTimestamp()
      }, { merge: true });

      toast.success('Logo updated successfully!');
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error updating logo:', error);
      
      let errorMessage = 'Failed to update logo. Please try again.';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Storage permission denied. Please check storage rules.';
      } else if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
        errorMessage = 'Firestore permission denied. Please check firestore rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);

      try {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/site_settings');
      } catch (e) {
        // Ignore throw
      }
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateInput.trim()) {
      toast.error('Template cannot be empty.');
      return;
    }

    setIsSavingTemplate(true);
    try {
      await setDoc(doc(db, 'settings', 'site_settings'), {
        whatsapp_template: templateInput,
        updated_at: serverTimestamp()
      }, { merge: true });

      toast.success('WhatsApp template updated successfully!');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template. Please try again.');
      try {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/site_settings');
      } catch (e) {
        // Ignore throw
      }
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
      </div>

      {/* Logo Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          Logo Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Logo */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Logo</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center bg-gray-50 h-48">
              <img 
                src={logoUrl} 
                alt="Current Logo" 
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Upload New Logo */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Upload New Logo</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white h-48 relative hover:bg-gray-50 transition-colors">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 hover:text-accent/80"
                    >
                      <span>Upload a file</span>
                      <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
              
              {previewUrl && (
                <label
                  htmlFor="logo-upload-change"
                  className="absolute bottom-2 right-2 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  Change
                  <input id="logo-upload-change" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveLogo}
            disabled={!selectedImage || isSavingLogo}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingLogo ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Logo
          </button>
        </div>
      </div>

      {/* WhatsApp Template Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-500" />
          WhatsApp Message Template
        </h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Customize the default message sent when a customer clicks "Buy Now". You can use the following placeholders:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">{'{product_name}'}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">{'{product_id}'}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">{'{price}'}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">{'{size_info}'}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">{'{url}'}</span>
          </div>

          <textarea
            value={templateInput}
            onChange={(e) => setTemplateInput(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-transparent resize-y font-mono text-sm"
            placeholder="Enter your WhatsApp message template here..."
          />

          <div className="flex justify-end">
            <button
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate || templateInput === whatsappTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingTemplate ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Template
            </button>
          </div>
        </div>
      </div>
      {/* Admins */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          Admins
        </h2>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Current administrators who have access to the admin dashboard.
          </p>

          {/* Admin List */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {defaultAdmins.map((email) => (
                <li key={email} className="px-4 py-3 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Danger Zone
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-red-900">Reset Website</p>
            <p className="text-sm text-red-700">
              Delete all products, banners, and settings. This action is permanent and cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* Reset Website Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-xl font-bold">Reset Website Data?</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This will <span className="font-bold text-red-600">permanently delete</span> all products, banners, and site settings. 
              All images in storage will also be removed. This action <span className="font-bold">cannot be undone</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetWebsite}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Yes, Reset All'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
