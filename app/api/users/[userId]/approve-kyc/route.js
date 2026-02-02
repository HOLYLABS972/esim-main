import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/[userId]/approve-kyc - Approve KYC for a user
 */
export async function POST(request, { params }) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log(`✅ Approving KYC for user ${userId}...`);

    // Update user's KYC status in Firestore
    const userRef = db.collection('users').doc(userId);
    
    await userRef.update({
      credit_card_status: 'approved',
      credit_card_applied: true,
      kycApproved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

    console.log(`✅ KYC approved for user ${userId}`);

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'KYC approved successfully'
    });

  } catch (error) {
    console.error('Error in approve-kyc API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
