'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Globe, CreditCard, Wifi } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { usePathname } from 'next/navigation';

const BottomSheet = ({ 
  isOpen, 
  onClose, 
  children, 
  title = "Select Plan",
  maxHeight = "90vh",
  showBackdrop = true,
  variant = "bottom" // "bottom" or "center"
}) => {
  const sheetRef = useRef(null);
  const { locale } = useI18n();
  const pathname = usePathname();
  
  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on drag down (only for bottom variant)
  const handleDragEnd = (event, info) => {
    if (variant === "bottom" && info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          

          {variant === "center" ? (
            /* Centered Modal */
            
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none">
              <motion.div
                ref={sheetRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300
                }}
                className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col pointer-events-auto"
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-200/50 flex-shrink-0" dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className={`text-xl font-semibold text-eerie-black tracking-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div 
                  className="overflow-y-auto flex-1" 
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {children}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Bottom Sheet */
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
              style={{ maxHeight }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-gray-200/50" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h2 className={`text-xl font-semibold text-eerie-black tracking-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div 
                className="overflow-y-auto" 
                style={{ maxHeight: `calc(${maxHeight} - 120px)` }}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {children}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
