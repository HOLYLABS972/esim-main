import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Return Policy - eSIM Plans',
  description: 'Learn about our return policy, refund terms, and exchange procedures for eSIM services. Understand eligibility requirements and how to request refunds.',
  keywords: ['return policy', 'refund policy', 'eSIM returns', 'digital goods refunds', 'eSIM exchanges'],
  openGraph: {
    title: 'Return Policy - eSIM Plans',
    description: 'Learn about our return policy, refund terms, and exchange procedures for eSIM services.',
    url: '/return-policy',
  },
  alternates: {
    canonical: '/return-policy',
  },
};

const ReturnPolicy = dynamic(() => import('../../src/components/ReturnPolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export default function ReturnPolicyPage() {
  return <ReturnPolicy />;
}
