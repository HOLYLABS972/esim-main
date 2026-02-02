import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/[userId]/add-balance - Add balance to a user account
 */
export async function POST(request, { params }) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { userId } = params;
    const body = await request.json();
    const { amount, description } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid amount is required'
      }, { status: 400 });
    }

    console.log(`💰 Adding balance ${amount} to user ${userId}...`);

    // Get current user to get current balance
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentBalance = parseFloat(userData.balance || userData.balance_rub || 0);
    const newBalance = currentBalance + parseFloat(amount);

    // Update user balance
    await userRef.update({
      balance: newBalance,
      balance_rub: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create transaction record
    try {
      await db.collection('transactions').add({
        userId: userId,
        type: 'deposit',
        amount: parseFloat(amount),
        amount_rub: parseFloat(amount),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: description || 'Admin balance addition',
        referenceType: 'admin_balance_addition',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't fail if transaction creation fails, balance was updated
    }

    // Get updated user
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.exists ? { id: updatedUserDoc.id, ...updatedUserDoc.data() } : null;

    console.log(`✅ Balance added for user ${userId}. New balance: ${newBalance}`);

    return NextResponse.json({
      success: true,
      user: updatedUserData,
      newBalance: newBalance,
      message: `Balance added successfully. New balance: $${newBalance.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error in add-balance API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
