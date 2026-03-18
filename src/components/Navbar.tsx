import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { LOGO_URL } from '../constants';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Catalogue', path: '/catalogue' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="LPMX Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              <span className="text-2xl font-bold text-[#0f1f3d] tracking-tight">LPMX</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-bold transition-colors hover:text-accent",
                  location.pathname === link.path ? "text-accent" : "text-gray-500"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className={cn(
                "p-2 rounded-full transition-colors hover:bg-gray-100",
                location.pathname === '/admin/login' ? "text-[#0f1f3d]" : "text-gray-500"
              )}
              title="Admin Login"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-[#0f1f3d] focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  location.pathname === link.path
                    ? "text-[#0f1f3d] bg-gray-50"
                    : "text-gray-500 hover:text-[#0f1f3d] hover:bg-gray-50"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium",
                location.pathname === '/admin/login'
                  ? "text-[#0f1f3d] bg-gray-50"
                  : "text-gray-500 hover:text-[#0f1f3d] hover:bg-gray-50"
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
