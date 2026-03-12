import { notFound } from 'next/navigation';
import RefundPolicyPage from '../../refund-policy/page';

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

export default function LocalizedRefundPolicyPage({ params }) {
  const { locale } = params;

  if (!SUPPORTED_LOCALES.has(locale)) {
    notFound();
  }

  return <RefundPolicyPage />;
}
