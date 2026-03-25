import { Link } from 'react-router-dom';
import { Facebook, Instagram, MessageCircle, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Footer() {
  const { logoUrl } = useSettings();

  return (
    <footer className="bg-[#0f1f3d] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Column 1 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logoUrl} alt="LPMX Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
              <h3 className="text-2xl font-bold tracking-tight">LPMX Nepal</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your one-stop destination for the best deals and quality products.
            </p>
            
            <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider text-gray-400">Contact Us</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <a href="https://maps.app.goo.gl/DCW9i84pQ3GDUK2UA?g_st=aw" className="text-gray-300">
                  Durbarmarg, Kathmandu 
                   </a> <br/>
                <a href="https://maps.app.goo.gl/E2kyXMfSWvGA4z7H6?g_st=aw" className="text-gray-300">
                  Kumaripati, Lalitpur <br/>
                   </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300">+977 9808456469</p>
              </div>
            </div>

            <a
              href="https://wa.me/9779808456469"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-medium hover:bg-[#128C7E] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/catalogue" className="text-gray-300 hover:text-white transition-colors">Catalogue</Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-gray-300 hover:text-white transition-colors">Admin Login</Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">Follow Us</h3>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/lpmxnepal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/lpmxnepal/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@lpmx.nepal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} LPMX Nepal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
