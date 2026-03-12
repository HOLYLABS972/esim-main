import { notFound } from 'next/navigation';
import PrivacyPolicyPage from '../../privacy-policy/page';
import PrivacyPolicyArPage from '../../ar/privacy-policy/page';
import PrivacyPolicyDePage from '../../de/privacy-policy/page';
import PrivacyPolicyEsPage from '../../es/privacy-policy/page';
import PrivacyPolicyFrPage from '../../fr/privacy-policy/page';
import PrivacyPolicyHePage from '../../he/privacy-policy/page';
import PrivacyPolicyRuPage from '../../ru/privacy-policy/page';

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
  ar: PrivacyPolicyArPage,
  de: PrivacyPolicyDePage,
  es: PrivacyPolicyEsPage,
  fr: PrivacyPolicyFrPage,
  he: PrivacyPolicyHePage,
  ru: PrivacyPolicyRuPage,
};

export default function LocalizedPrivacyPolicyPage({ params }) {
  const { locale } = params;

  if (!SUPPORTED_LOCALES.has(locale)) {
    notFound();
  }

  const Component = localeComponentMap[locale] || PrivacyPolicyPage;
  return <Component />;
}
