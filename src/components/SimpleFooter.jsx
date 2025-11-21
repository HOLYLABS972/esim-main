'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

export default function SimpleFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  
  // Get language prefix from pathname
  const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)\//);
  const langPrefix = langMatch ? `/${langMatch[1]}` : '';
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center">
          {/* User info and Authentication */}
          <div className="flex items-center gap-4">
            {/* User Information */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-tufts-blue transition-colors"
                >
                  <span className="hidden sm:inline">{currentUser.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                href={`${langPrefix}/login`}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-tufts-blue transition-colors px-2 py-1 rounded hover:bg-gray-50"
                title="Login"
              >
                <LogIn size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}