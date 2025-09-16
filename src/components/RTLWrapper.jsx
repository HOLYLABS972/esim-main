'use client';

import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection } from '../utils/languageUtils';

const RTLWrapper = ({ children }) => {
  const { locale } = useI18n();
  const direction = getLanguageDirection(locale);
  
  return (
    <div dir={direction} lang={locale}>
      {children}
    </div>
  );
};

export default RTLWrapper;
