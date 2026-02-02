export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore, getAuth } from '../../lib/firebaseAdmin';

/**
 * GET /api/users - Fetch users from Firebase with pagination and filters
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
    const role = searchParams.get('role') || 'all';
    
    const skip = (page - 1) * limit;

    console.log('👥 Fetching users from Firestore...', { page, limit, search, role });

    // Build query
    let usersQuery = db.collection('users');

    // Filter by role if specified
    if (role !== 'all') {
      usersQuery = usersQuery.where('role', '==', role);
    }

    // Get all matching users
    const usersSnapshot = await usersQuery.get();

    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter (client-side)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => {
        const email = (user.email || '').toLowerCase();
        const name = (user.name || user.displayName || user.full_name || '').toLowerCase();
        const phone = (user.phone || user.phoneNumber || '').toLowerCase();
        return email.includes(searchLower) || name.includes(searchLower) || phone.includes(searchLower);
      });
    }

    // Sort by created date
    users.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
      return bTime - aTime;
    });

    const total = users.length;

    // Apply pagination
    const paginatedUsers = users.slice(skip, skip + limit);

    console.log(`✅ Found ${total} users, returning ${paginatedUsers.length} for page ${page}`);

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/users - Update a user in Firestore
 */
export async function PUT(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const data = await request.json();

    console.log('✏️ Updating user in Firestore...', data.id);

    if (!data.id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update provided fields
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.balance !== undefined) updateData.balance = parseFloat(data.balance);

    await db.collection('users').doc(data.id).update(updateData);

    // If email is being updated, also update Firebase Auth
    const auth = getAuth();
    if (data.email && auth) {
      try {
        await auth.updateUser(data.id, { email: data.email });
      } catch (authError) {
        console.warn('Failed to update user email in Firebase Auth:', authError);
      }
    }

    console.log(`✅ Updated user ${data.id}`);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user in Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/users - Delete a user from Firestore and Firebase Auth
 */
export async function DELETE(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('🗑️ Deleting user from Firestore...', id);

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Delete from Firestore
    await db.collection('users').doc(id).delete();

    // Delete from Firebase Auth
    const auth = getAuth();
    if (auth) {
      try {
        await auth.deleteUser(id);
      } catch (authError) {
        console.warn('Failed to delete user from Firebase Auth:', authError);
      }
    }

    console.log(`✅ Deleted user ${id}`);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
