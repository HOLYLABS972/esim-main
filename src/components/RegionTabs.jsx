'use client';

import React from 'react';
import { useI18n } from '../contexts/I18nContext';

const RegionTabs = ({ selectedRegion, onRegionChange }) => {
  const { t } = useI18n();

  const regions = [
    { id: 'popular', icon: '🔥', label: t('regions.popular', 'Popular') },
    { id: 'asia', icon: '🌏', label: t('regions.asia', 'Asia') },
    { id: 'europe', icon: '🇪🇺', label: t('regions.europe', 'Europe') },
    { id: 'americas', icon: '🌎', label: t('regions.americas', 'Americas') },
    { id: 'africa', icon: '🌍', label: t('regions.africa', 'Africa') },
    { id: 'oceania', icon: '🌏', label: t('regions.oceania', 'Oceania') },
    { id: 'all', icon: '🌐', label: t('regions.all', 'All') }
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {regions.map(region => (
          <button
            key={region.id}
            onClick={() => onRegionChange(region.id)}
            className={`px-2 py-1.5 border-2 rounded-full font-medium transition-all duration-200 ${
              selectedRegion === region.id
                ? 'bg-tufts-blue text-white shadow-md border-tufts-blue '
                : 'bg-white text-gray-700 border-gray-200/40 hover:border-tufts-blue hover:text-tufts-blue shadow-md shadow-gray-200/50'
            }`}
          >
            {region.icon} {region.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionTabs;

