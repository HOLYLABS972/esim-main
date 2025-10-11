'use client';

import React from 'react';
import { useI18n } from '../contexts/I18nContext';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    const emoji = String.fromCodePoint(...codePoints);
    return emoji;
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

const CountryCard = ({ 
  country, 
  onClick, 
  userProfile, 
  referralSettings, 
  regularSettings,
  isMobile = false 
}) => {
  const { t } = useI18n();

  // Calculate discount info for badge
  const getDiscountInfo = () => {
    const originalPrice = country.minPrice;
    const hasReferralDiscount = userProfile?.referralCodeUsed;
    let hasDiscount = false;
    let discountPercentage = 0;
    
    if (originalPrice && originalPrice > 0) {
      if (hasReferralDiscount && referralSettings) {
        discountPercentage = referralSettings.discountPercentage;
        const minimumPrice = referralSettings.minimumPrice;
        const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
        hasDiscount = discountedPrice < originalPrice;
      } else if (regularSettings) {
        discountPercentage = regularSettings.discountPercentage;
        const minimumPrice = regularSettings.minimumPrice;
        const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
        hasDiscount = discountedPrice < originalPrice;
      }
    }
    
    return { hasDiscount, discountPercentage };
  };

  // Calculate prices for display
  const getPriceDisplay = () => {
    const originalPrice = country.minPrice;
    const hasReferralDiscount = userProfile?.referralCodeUsed;
    
    let discountedPrice, hasDiscount, discountPercentage;
    
    if (hasReferralDiscount && referralSettings) {
      discountPercentage = referralSettings.discountPercentage;
      const minimumPrice = referralSettings.minimumPrice;
      discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
      hasDiscount = discountedPrice < originalPrice;
    } else if (regularSettings) {
      discountPercentage = regularSettings.discountPercentage;
      const minimumPrice = regularSettings.minimumPrice;
      discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
      hasDiscount = discountedPrice < originalPrice;
    }
    
    return { discountedPrice, hasDiscount, discountPercentage, originalPrice };
  };

  const { hasDiscount: showBadge, discountPercentage: badgePercent } = getDiscountInfo();

  // Desktop card styles
  const desktopImageHeight = "h-36";
  const desktopEmojiSize = "text-8xl";
  const desktopNameSize = "text-xl";
  const desktopPriceSize = "text-2xl";
  
  // Mobile card styles
  const mobileImageHeight = "h-32";
  const mobileEmojiSize = "text-6xl";
  const mobileNameSize = "text-sm";
  const mobilePriceSize = "text-lg";

  return (
    <button
      className="w-full bg-white border-2 border-gray-200/40 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
      onClick={onClick}
    >
      {/* Country Flag/Image Section - Full Width */}
      <div className={`w-full ${isMobile ? mobileImageHeight : desktopImageHeight} bg-gray-50 flex items-center justify-center`}>
        {country.photo && country.photo.includes('firebasestorage') ? (
          <img 
            src={country.photo} 
            alt={country.displayName || country.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn(`⚠️ Failed to load photo for ${country.code}: ${country.photo}`);
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                const emoji = getFlagEmoji(country.code);
                parent.innerHTML = `<span class="${isMobile ? mobileEmojiSize : desktopEmojiSize}">${emoji}</span>`;
              }
            }}
          />
        ) : (
          <span className={isMobile ? mobileEmojiSize : desktopEmojiSize}>
            {getFlagEmoji(country.code)}
          </span>
        )}
      </div>

      {/* Country Info Section */}
      <div className={isMobile ? "px-3 py-3" : "px-5 py-5"}>
        {/* Country Name with Badge - Desktop Only */}
        {!isMobile && (
          <div className=" gap-2 mb-3">
            <p className={`${desktopNameSize} font-semibold text-gray-900 line-clamp-2 group-hover:text-tufts-blue transition-colors duration-200 flex-1`}>
              {country.displayName || country.name}
            </p>
            {showBadge && (
              <div className="flex bg-cobalt-blue rounded-full px-2 py-1 items-center gap-1 flex-shrink-0">
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  Save {badgePercent}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Country Name - Mobile Only */}
        {isMobile && (
          <h5 className={`${mobileNameSize} font-semibold text-start text-gray-900 mb-2 line-clamp-2 group-hover:text-tufts-blue transition-colors duration-200 `}>
            {country.displayName || country.name}
          </h5>
        )}
        
        {/* Price Section */}
        <div className={isMobile ? "" : "flex flex-col text-start"}>
          {country.minPrice && country.minPrice > 0 ? (() => {
            const { discountedPrice, hasDiscount, originalPrice } = getPriceDisplay();
            
            if (hasDiscount) {
              return (
                <div className="text-start">
                  <span className="text-xs text-gray-500 mb-1 block">
                    {t('plans.startingFrom', 'Starting from')}
                  </span>
                  <div className={`flex items-center ${isMobile ? 'gap-1 flex-wrap' : 'gap-2'}`}>
                    <span className={`${isMobile ? mobilePriceSize : desktopPriceSize} font-bold ${isMobile ? 'text-green-600' : 'text-green-800'}`}>
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'text-gray-500' : 'text-gray-800'} line-through`}>
                      ${originalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="text-start">
                  <span className="text-xs text-gray-500 mb-1 block">
                    {t('plans.startingFrom', 'Starting from')}
                  </span>
                  <span className={`${isMobile ? mobilePriceSize : desktopPriceSize} font-bold text-gray-900 ${!isMobile && 'mt-2'}`}>
                    ${country.minPrice.toFixed(2)}
                  </span>
                </div>
              );
            }
          })() : (
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {t('plans.noPlansAvailable', 'No plans available')}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default CountryCard;

