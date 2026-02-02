import { NextResponse } from 'next/server';
import { getFirestore } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[userId]/orders - Fetch orders for a specific user from Firestore
 */
export async function GET(request, { params }) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { userId } = params;

    console.log(`📦 Fetching orders for user ${userId} from Firestore...`);

    // Fetch orders for this user
    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${orders.length} orders for user ${userId}`);

    return NextResponse.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Error in user orders API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
