import { notFound } from 'next/navigation';
import AffiliatePage from '../../affiliate/page';

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

export default function LocalizedAffiliatePage({ params }) {
  const { locale } = params;

  if (!SUPPORTED_LOCALES.has(locale)) {
    notFound();
  }

  return <AffiliatePage />;
}
