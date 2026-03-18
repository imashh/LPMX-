import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContext';
import { auth, db } from '../../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const { logoUrl } = useSettings();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is admin
      const isDefaultAdmin = result.user.email?.toLowerCase() === 'grafiqo.np@gmail.com' || 
                            result.user.email?.toLowerCase() === 'simplex.ktm@gmail.com';
      let isAdminUser = isDefaultAdmin;
      
      try {
        const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
        if (adminDoc.exists()) {
          isAdminUser = true;
        } else if (isDefaultAdmin) {
          // Bootstrap the default admin
          await setDoc(doc(db, 'admins', result.user.uid), {
            role: 'admin',
            email: result.user.email,
            created_at: serverTimestamp()
          });
        }
      } catch (e) {
        // If permission denied, they are not an admin (unless they are the default admin)
        console.log("Not an admin or permission denied", e);
      }
      
      if (isAdminUser) {
        toast.success('Login successful');
        navigate('/admin/dashboard');
      } else {
        await auth.signOut();
        toast.error('Unauthorized: You are not an admin');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized for Firebase Auth. Please check Firebase Console.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login popup was closed before completing.');
      } else if (error.code === 'auth/web-storage-unsupported' || error.message?.includes('third-party cookies')) {
        toast.error('Please enable third-party cookies or try a different browser to log in.');
      } else {
        toast.error(error.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div>
          <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-[#0f1f3d]/20">
            <img src={logoUrl} alt="LPMX Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your catalogue
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all shadow-lg shadow-accent/20 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
