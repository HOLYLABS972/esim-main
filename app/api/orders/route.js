export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from '../../../lib/firebaseAdmin';

/**
 * GET /api/orders - Fetch orders from Firestore with pagination and filters
 */
export async function GET(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;

    console.log('📦 Fetching orders from Firestore...', { page, limit, search, status });

    // Build query
    let ordersQuery = db.collection('orders');

    // Filter by status if specified
    if (status !== 'all') {
      ordersQuery = ordersQuery.where('status', '==', status);
    }

    // Get all matching orders
    const ordersSnapshot = await ordersQuery
      .orderBy('createdAt', 'desc')
      .get();

    let orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter (client-side for now)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => {
        const email = (order.email || order.userEmail || '').toLowerCase();
        const orderId = (order.id || '').toLowerCase();
        const iccid = (order.iccid || '').toLowerCase();
        return email.includes(searchLower) || orderId.includes(searchLower) || iccid.includes(searchLower);
      });
    }

    const total = orders.length;

    // Apply pagination
    const paginatedOrders = orders.slice(skip, skip + limit);

    console.log(`✅ Found ${total} orders, returning ${paginatedOrders.length} for page ${page}`);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching orders from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/orders - Update an order in Firestore
 */
export async function PUT(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const data = await request.json();

    console.log('✏️ Updating order in Firestore...', data.id);

    if (!data.id) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update provided fields
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tracking_info !== undefined) updateData.tracking_info = data.tracking_info;

    await db.collection('orders').doc(data.id).update(updateData);

    console.log(`✅ Updated order ${data.id}`);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating order in Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
