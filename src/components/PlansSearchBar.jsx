'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const PlansSearchBar = ({ searchTerm, onSearchChange }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col md:flex-row gap-3 lg:gap-4 mb-6 lg:mb-8 max-w-4xl mx-auto">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('plans.searchPlaceholder', 'Search countries...')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 lg:py-3 border-0 shadow-lg rounded-full border-4 border-gray-200/40 focus:ring-2 focus:ring-blue-200/20 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default PlansSearchBar;

