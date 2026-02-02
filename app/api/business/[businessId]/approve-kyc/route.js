import { NextResponse } from 'next/server';
import { db } from '../../../../../src/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/business/[businessId]/approve-kyc - Approve KYC for a business partner
 */
export async function POST(request, { params }) {
  try {
    const { businessId } = params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 });
    }

    console.log(`✅ Approving KYC for business partner: ${businessId}`);

    // Update business user's KYC status in Firebase
    const businessUserRef = doc(db, 'business_users', businessId);
    
    await updateDoc(businessUserRef, {
      kycStatus: 'approved',
      kycApprovedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`✅ KYC approved for business partner: ${businessId}`);

    return NextResponse.json({
      success: true,
      message: 'KYC approved successfully'
    });

  } catch (error) {
    console.error('❌ Error approving KYC:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to approve KYC'
    }, { status: 500 });
  }
}
