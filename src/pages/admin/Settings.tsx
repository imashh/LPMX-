import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSettings } from '../../contexts/SettingsContext';
import { compressImage } from '../../lib/imageCompression';

export default function Settings() {
  const { logoUrl } = useSettings();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to upload.');
      return;
    }

    setIsSaving(true);
    try {
      // Compress image
      const compressedImage = await compressImage(selectedImage);

      // Upload new logo to Firebase Storage
      const storageRef = ref(storage, `settings/logo_${Date.now()}_${compressedImage.name}`);
      await uploadBytes(storageRef, compressedImage);
      const downloadUrl = await getDownloadURL(storageRef);

      // Save URL to Firestore
      await setDoc(doc(db, 'settings', 'site_settings'), {
        logo_url: downloadUrl,
        updated_at: new Date().toISOString()
      }, { merge: true });

      toast.success('Logo updated successfully!');
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Failed to update logo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Management</h2>
        
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
            onClick={handleSave}
            disabled={!selectedImage || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
