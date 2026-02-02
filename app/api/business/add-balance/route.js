import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { businessId, amount, description } = body;

    // Validate required fields
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    console.log(`💰 Adding $${amount} transaction for business: ${businessId}`);

    // Find business user in Firebase
    const businessUserRef = doc(db, 'business_users', businessId);
    const businessUserDoc = await getDoc(businessUserRef);
    
    if (!businessUserDoc.exists()) {
      console.error(`❌ Business user not found: ${businessId}`);
      return NextResponse.json(
        { success: false, error: `Business user not found with ID: ${businessId}` },
        { status: 404 }
      );
    }

    const businessUserData = businessUserDoc.data();
    console.log('✅ Business user found:', businessUserData.companyName || businessUserData.email);

    const currentBalance = businessUserData.balance || 0;
    const newBalance = currentBalance + amount;
    console.log(`💰 Current balance: $${currentBalance}, Adding: $${amount}, New balance: $${newBalance}`);

    // Create transaction in Firebase for the business user
    // Business users might have a userId field that links to users collection
    // If they do, create transaction in users/{userId}/transactions
    // Otherwise, create in billing_transactions collection
    let transactionRef;
    let transactionData = {
      type: 'deposit',
      amount: amount,
      description: description || 'New user gift - $100 topup',
      status: 'completed',
      method: 'admin_gift',
      currency: 'USD',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: 'admin',
      businessId: businessId,
      giftType: 'new_user_gift',
      previousBalance: currentBalance,
      newBalance: newBalance
    };

    // If business has a userId, create transaction in users/{userId}/transactions
    if (businessUserData.userId) {
      transactionRef = doc(collection(db, 'users', businessUserData.userId, 'transactions'));
    } else {
      // Otherwise, create in billing_transactions collection
      transactionRef = doc(collection(db, 'billing_transactions'));
      transactionData.userId = businessId;
      transactionData.clientId = businessId;
    }

    try {
      await setDoc(transactionRef, transactionData);
      console.log('✅ Transaction created:', transactionRef.id);
    } catch (transactionError) {
      console.error('❌ Error creating transaction:', transactionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create transaction: ' + transactionError.message },
        { status: 500 }
      );
    }

    // Update business balance in Firebase
    try {
      await updateDoc(businessUserRef, {
        balance: newBalance,
        lastTransactionAt: serverTimestamp()
      });
      console.log('✅ Business balance updated successfully');
    } catch (updateError) {
      console.error('❌ Error updating business balance:', updateError);
      // Transaction was created but balance update failed - this is a problem
      console.error('⚠️ WARNING: Transaction created but balance update failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction created but failed to update balance: ' + updateError.message,
          transactionId: transactionRef.id
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully added $${amount} transaction for business: ${businessId}`);
    console.log(`✅ Business balance updated to: $${newBalance}`);

    return NextResponse.json({
      success: true,
      transactionId: transactionRef.id,
      newBalance: newBalance,
      message: `$${amount} transaction created successfully`
    });

  } catch (error) {
    console.error('❌ Error adding business transaction:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add transaction',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
