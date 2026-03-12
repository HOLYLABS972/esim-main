import { notFound } from 'next/navigation';
import TermsOfServicePage from '../../terms-of-service/page';
import TermsOfServiceArPage from '../../ar/terms-of-service/page';
import TermsOfServiceDePage from '../../de/terms-of-service/page';
import TermsOfServiceEsPage from '../../es/terms-of-service/page';
import TermsOfServiceFrPage from '../../fr/terms-of-service/page';
import TermsOfServiceHePage from '../../he/terms-of-service/page';
import TermsOfServiceRuPage from '../../ru/terms-of-service/page';

const SUPPORTED_LOCALES = new Set([
  'ar',
  'de',
  'en',
  'en-US',
  'en-CA',
  'es',
  'fr',
  'he',
  'hi',
  'ja',
  'ko',
  'pt',
  'pt-BR',
  'ru',
  'tr',
  'ur',
  'zh',
  'zh-Hans',
]);

const localeComponentMap = {
  ar: TermsOfServiceArPage,
  de: TermsOfServiceDePage,
  es: TermsOfServiceEsPage,
  fr: TermsOfServiceFrPage,
  he: TermsOfServiceHePage,
  ru: TermsOfServiceRuPage,
};

export default function LocalizedTermsOfServicePage({ params }) {
  const { locale } = params;

  if (!SUPPORTED_LOCALES.has(locale)) {
    notFound();
  }

  const Component = localeComponentMap[locale] || TermsOfServicePage;
  return <Component />;
}
