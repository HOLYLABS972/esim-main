export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from '../../lib/firebaseAdmin';

/**
 * GET /api/coupons - Fetch coupons from Firestore
 */
export async function GET(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    console.log('📋 Fetching coupons from Firestore...', { search });

    // Fetch all coupons
    const couponsSnapshot = await db.collection('coupons').get();
    let coupons = couponsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      coupons = coupons.filter(coupon => {
        const code = (coupon.code || '').toLowerCase();
        const description = (coupon.description || '').toLowerCase();
        return code.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Sort by created_at descending
    coupons.sort((a, b) => {
      const aTime = a.created_at?.toMillis?.() || a.created_at?._seconds * 1000 || 0;
      const bTime = b.created_at?.toMillis?.() || b.created_at?._seconds * 1000 || 0;
      return bTime - aTime;
    });

    console.log(`✅ Found ${coupons.length} coupons from Firestore`);

    return NextResponse.json({
      success: true,
      coupons,
      total: coupons.length
    });

  } catch (error) {
    console.error('❌ Error fetching coupons from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/coupons - Create a new coupon in Firestore
 */
export async function POST(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const data = await request.json();

    console.log('➕ Creating new coupon in Firestore...', data.code);

    // Validate required fields
    if (!data.code || !data.discount_value) {
      return NextResponse.json({
        success: false,
        error: 'Code and discount value are required'
      }, { status: 400 });
    }

    // Check for duplicate code
    const existingSnapshot = await db.collection('coupons')
      .where('code', '==', data.code)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Coupon code already exists'
      }, { status: 400 });
    }

    // Create coupon document
    const couponData = {
      code: data.code,
      discount_type: data.discount_type || 'percentage',
      discount_value: parseFloat(data.discount_value),
      valid_from: data.valid_from ? admin.firestore.Timestamp.fromDate(new Date(data.valid_from)) : admin.firestore.FieldValue.serverTimestamp(),
      valid_until: data.valid_until ? admin.firestore.Timestamp.fromDate(new Date(data.valid_until)) : null,
      max_uses: data.max_uses ? parseInt(data.max_uses) : null,
      current_uses: 0,
      max_uses_per_user: data.max_uses_per_user ? parseInt(data.max_uses_per_user) : 1,
      min_purchase_amount: data.min_purchase_amount ? parseFloat(data.min_purchase_amount) : 0,
      applicable_plans: data.applicable_plans || null,
      applicable_countries: data.applicable_countries || null,
      is_active: data.is_active !== false,
      description: data.description || '',
      created_by: data.created_by || null,
      metadata: data.metadata || {},
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('coupons').add(couponData);

    console.log(`✅ Created coupon ${data.code} with ID: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      coupon: {
        id: docRef.id,
        ...couponData
      }
    });

  } catch (error) {
    console.error('❌ Error creating coupon in Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/coupons - Update an existing coupon in Firestore
 */
export async function PUT(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const data = await request.json();

    console.log('✏️ Updating coupon in Firestore...', data.id);

    if (!data.id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required'
      }, { status: 400 });
    }

    const updateData = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update provided fields
    if (data.code !== undefined) updateData.code = data.code;
    if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
    if (data.discount_value !== undefined) updateData.discount_value = parseFloat(data.discount_value);
    if (data.valid_from !== undefined) updateData.valid_from = data.valid_from ? admin.firestore.Timestamp.fromDate(new Date(data.valid_from)) : null;
    if (data.valid_until !== undefined) updateData.valid_until = data.valid_until ? admin.firestore.Timestamp.fromDate(new Date(data.valid_until)) : null;
    if (data.max_uses !== undefined) updateData.max_uses = data.max_uses ? parseInt(data.max_uses) : null;
    if (data.max_uses_per_user !== undefined) updateData.max_uses_per_user = parseInt(data.max_uses_per_user);
    if (data.min_purchase_amount !== undefined) updateData.min_purchase_amount = parseFloat(data.min_purchase_amount);
    if (data.applicable_plans !== undefined) updateData.applicable_plans = data.applicable_plans;
    if (data.applicable_countries !== undefined) updateData.applicable_countries = data.applicable_countries;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    await db.collection('coupons').doc(data.id).update(updateData);

    console.log(`✅ Updated coupon ${data.id}`);

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating coupon in Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/coupons - Delete a coupon from Firestore
 */
export async function DELETE(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('🗑️ Deleting coupon from Firestore...', id);

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required'
      }, { status: 400 });
    }

    await db.collection('coupons').doc(id).delete();

    console.log(`✅ Deleted coupon ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting coupon from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
